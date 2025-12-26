import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = Number(process.env.PORT ?? 3000);
const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_SECRET = process.env.ACCESS_SECRET ?? "petfit-demo-access-secret";
const REFRESH_SECRET =
  process.env.REFRESH_SECRET ?? "petfit-demo-refresh-secret";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const ACCESS_TTL_MS = 15 * 60 * 1000; // 15m
const REFRESH_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14d

type DemoScenario = "noPet" | "hasPet";
type DemoLoginBody = {
  scenario?: DemoScenario;
};

type AccessPayload = {
  memberId: number;
  hasPet: boolean;
};

type RefreshPayload = {
  memberId: number;
};

/** -----------------------------
 * ApiResponse (프론트와 포맷 통일)
 * ----------------------------- */
type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  content: T | null;
};

function ok<T>(content: T, message = "OK", code = "OK"): ApiResponse<T> {
  return { success: true, code, message, content };
}

function fail<T>(message: string, code: string): ApiResponse<T> {
  return { success: false, code, message, content: null };
}

/** -----------------------------
 * Cookie Options
 * ----------------------------- */
function cookieOpt(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: IS_PROD, // 운영 HTTPS에서 true
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}

/** -----------------------------
 * Demo 규칙: 서버가 시나리오 결정
 * ----------------------------- */
function resolveDemoScenario(scenario?: DemoScenario): AccessPayload {
  switch (scenario) {
    case "hasPet":
      return { memberId: 2, hasPet: true };
    case "noPet":
    default:
      return { memberId: 1, hasPet: false };
  }
}

// refresh에서 복원 규칙(SSOT)
function resolveByMemberId(memberId: number): AccessPayload {
  if (memberId === 1) return { memberId: 1, hasPet: false };
  return { memberId: 2, hasPet: true };
}

function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(payload: RefreshPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "14d" });
}

/** -----------------------------
 * Access Guard Middleware
 * - /api 보호 라우트에서 사용
 * - req.auth에 AccessPayload 주입
 * ----------------------------- */
type AuthedRequest = Request & { auth?: AccessPayload };

function requireAccess(req: AuthedRequest, res: Response, next: NextFunction) {
  const at = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!at) {
    return res.status(401).json(fail("NO_ACCESS_TOKEN", "AUTH_401"));
  }

  try {
    const decoded = jwt.verify(at, ACCESS_SECRET) as AccessPayload;
    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json(fail("INVALID_OR_EXPIRED_ACCESS", "AUTH_401"));
  }
}

/** -----------------------------
 * Routes
 * ----------------------------- */

/**
 * POST /api/auth/demo-login
 * body: { scenario: "noPet" | "hasPet" }
 * - AT/RT HttpOnly 쿠키 심기
 */
app.post(
  "/api/auth/demo-login",
  (req: Request<unknown, unknown, DemoLoginBody>, res: Response) => {
    const payload = resolveDemoScenario(req.body?.scenario);

    const at = signAccessToken(payload);
    const rt = signRefreshToken({ memberId: payload.memberId });

    res.cookie(ACCESS_COOKIE, at, cookieOpt(ACCESS_TTL_MS));
    res.cookie(REFRESH_COOKIE, rt, cookieOpt(REFRESH_TTL_MS));

    return res.status(200).json(ok(null, "DEMO_LOGIN_OK", "AUTH_200"));
  }
);

/**
 * GET /api/auth/me
 * - AT 검증 → { memberId, hasPet }
 */
app.get("/api/auth/me", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId, hasPet } = req.auth!;
  return res.status(200).json(ok({ memberId, hasPet }, "ME_OK", "AUTH_200"));
});

/**
 * POST /api/auth/refresh
 * - RT 검증 → 새 AT 재발급
 * - demo에서는 memberId 기반으로 hasPet 복원(서버 규칙)
 */
app.post("/api/auth/refresh", (req: Request, res: Response) => {
  const rt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rt) {
    return res.status(401).json(fail("NO_REFRESH_TOKEN", "AUTH_401"));
  }

  try {
    const decoded = jwt.verify(rt, REFRESH_SECRET) as RefreshPayload;
    const payload = resolveByMemberId(decoded.memberId);

    const newAt = signAccessToken(payload);
    res.cookie(ACCESS_COOKIE, newAt, cookieOpt(ACCESS_TTL_MS));

    return res.status(200).json(ok(null, "REFRESH_OK", "AUTH_200"));
  } catch {
    return res.status(401).json(fail("INVALID_OR_EXPIRED_REFRESH", "AUTH_401"));
  }
});

/**
 * GET /api/pets
 * - AT 검증 → memberId 기반으로 pets 반환
 * - demo: memberId=2일 때만 "기존 유저"로 간주하고 고정 목록 반환
 */
type Pet = {
  id: number;
  name: string;
  type: "강아지" | "고양이" | "햄스터" | "조류" | "어류" | "파충류";
  gender: "남아" | "여아" | "중성";
  birthDate: string; // ISO string (YYYY-MM-DD)
  isFavorite: boolean;
};

const DEMO_PETS_BY_MEMBER: Record<number, Pet[]> = {
  2: [
    {
      id: 201,
      name: "콩이",
      type: "강아지",
      gender: "남아",
      birthDate: "2021-03-01",
      isFavorite: true,
    },
    {
      id: 202,
      name: "보리",
      type: "강아지",
      gender: "여아",
      birthDate: "2020-10-12",
      isFavorite: false,
    },
  ],
};

app.get("/api/pets", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  const pets = DEMO_PETS_BY_MEMBER[memberId] ?? [];
  return res.status(200).json(ok(pets, "PETS_OK", "PETS_200"));
});

// (선택) GET /api/health
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json(ok({ ok: true }, "HEALTH_OK", "SYS_200"));
});

app.listen(PORT, () => {
  console.log(
    `[petfit-server] listening on :${PORT} (NODE_ENV=${
      process.env.NODE_ENV ?? "undefined"
    })`
  );
});
