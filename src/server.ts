import "dotenv/config";
import express, { Request, Response } from "express";
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

type DemoScenario = "new" | "existing";

type DemoLoginBody = {
  scenario?: DemoScenario;
};

type AccessPayload = {
  memberId: number;
  isNewUser: boolean;
};

type RefreshPayload = {
  memberId: number;
};

function cookieOpt(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: IS_PROD, // 운영 HTTPS에서 true
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}

// demo 규칙: 서버가 시나리오를 결정
function resolveDemoScenario(scenario?: DemoScenario): AccessPayload {
  if (scenario === "existing") return { memberId: 2, isNewUser: false };
  return { memberId: 1, isNewUser: true };
}

function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(payload: RefreshPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "14d" });
}

/**
 * POST /api/auth/demo-login
 * body: { scenario: "new" | "existing" }
 * - AT/RT HttpOnly 쿠키 심기
 */
app.post(
  "/api/auth/demo-login",
  (req: Request<unknown, unknown, DemoLoginBody>, res: Response) => {
    const { memberId, isNewUser } = resolveDemoScenario(req.body?.scenario);

    const at = signAccessToken({ memberId, isNewUser });
    const rt = signRefreshToken({ memberId });

    res.cookie(ACCESS_COOKIE, at, cookieOpt(ACCESS_TTL_MS));
    res.cookie(REFRESH_COOKIE, rt, cookieOpt(REFRESH_TTL_MS));

    return res.status(200).json({ ok: true });
  }
);

/**
 * GET /api/auth/me
 * - AT 검증 → { memberId, isNewUser }
 */
app.get("/api/auth/me", (req: Request, res: Response) => {
  const at = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!at)
    return res.status(401).json({ ok: false, reason: "NO_ACCESS_TOKEN" });

  try {
    const decoded = jwt.verify(at, ACCESS_SECRET) as AccessPayload;

    return res.status(200).json({
      ok: true,
      memberId: decoded.memberId,
      isNewUser: decoded.isNewUser,
    });
  } catch {
    return res
      .status(401)
      .json({ ok: false, reason: "INVALID_OR_EXPIRED_ACCESS" });
  }
});

/**
 * POST /api/auth/refresh
 * - RT 검증 → 새 AT 재발급
 * - demo에서는 memberId 기반으로 isNewUser 복원(서버 규칙)
 */
app.post("/api/auth/refresh", (req: Request, res: Response) => {
  const rt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rt)
    return res.status(401).json({ ok: false, reason: "NO_REFRESH_TOKEN" });

  try {
    const decoded = jwt.verify(rt, REFRESH_SECRET) as RefreshPayload;
    const memberId = decoded.memberId;

    // demo 규칙: memberId=1 신규, 2 기존
    const isNewUser = memberId === 1;

    const newAt = signAccessToken({ memberId, isNewUser });
    res.cookie(ACCESS_COOKIE, newAt, cookieOpt(ACCESS_TTL_MS));

    return res.status(200).json({ ok: true });
  } catch {
    return res
      .status(401)
      .json({ ok: false, reason: "INVALID_OR_EXPIRED_REFRESH" });
  }
});

// (선택) health
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(
    `[petfit-server] listening on :${PORT} (NODE_ENV=${
      process.env.NODE_ENV ?? "undefined"
    })`
  );
});
