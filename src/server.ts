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

/** -----------------------------
 * Types
 * ----------------------------- */
type DemoSessionScenario = "new" | "existing";
type DemoLoginBody = { scenario?: DemoSessionScenario };

type AccessPayload = { memberId: number };
type RefreshPayload = { memberId: number };

type DemoSession = {
  scenario: DemoSessionScenario;
  onboarding: { petDone: boolean; routineDone: boolean };
  pet?: Pet;
  slotByPetId: Record<number, Slot | undefined>;
};

type Pet = {
  id: number;
  name: string;
  type: "강아지" | "고양이" | "햄스터" | "조류" | "어류" | "파충류";
  gender: "남아" | "여아" | "중성";
  birthDate: string; // ISO string (YYYY-MM-DD)
  isFavorite: boolean;
};

type Slot = {
  feedActivated: boolean;
  waterActivated: boolean;
  walkActivated: boolean;
  pottyActivated: boolean;
  dentalActivated: boolean;
  skinActivated: boolean;
  feedAmount: number;
  waterAmount: number;
  walkAmount: number;
};

type RoutineDto = {
  routineId: number;
  category: "feed" | "water" | "walk" | "potty" | "dental" | "skin";
  status: "CHECKED" | "MEMO" | "UNCHECKED";
  targetAmount: number;
  actualAmount: number;
  content: string;
  date: string; // YYYY-MM-DD
};

/** -----------------------------
 * Demo Data (existing)
 * ----------------------------- */
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

/** -----------------------------
 * Demo Session Store (in-memory)
 * ----------------------------- */
const demoSessions: Record<number, DemoSession> = {};

function ensureSession(memberId: number) {
  if (demoSessions[memberId]) return;

  // 서버 재시작 등으로 세션이 날아간 경우 기본 복구
  const scenario: DemoSessionScenario = memberId === 2 ? "existing" : "new";
  initDemoSession(memberId, scenario);
}

function initDemoSession(memberId: number, scenario: DemoSessionScenario) {
  if (scenario === "existing") {
    demoSessions[memberId] = {
      scenario,
      onboarding: { petDone: true, routineDone: true },
      slotByPetId: {},
      // existing은 기존 상수 데이터로 충분하므로 여기에는 안 넣어도 됨
    };
    return;
  }

  demoSessions[memberId] = {
    scenario,
    onboarding: { petDone: false, routineDone: false },
    pet: undefined,
    slotByPetId: {},
  };
}

function resolveMemberIdByScenario(s?: DemoSessionScenario) {
  // 데모는 시나리오에 따라 고정 memberId 부여 (기존 구조 유지)
  // - new: 1
  // - existing: 2
  return s === "existing" ? 2 : 1;
}

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
 * JWT helpers
 * ----------------------------- */
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
 * body: { scenario: "new" | "existing" }
 * - AT/RT HttpOnly 쿠키 심기
 * - demoSession 초기화
 */
app.post(
  "/api/auth/demo-login",
  (req: Request<unknown, unknown, DemoLoginBody>, res: Response) => {
    const raw = req.body.scenario;

    if (raw !== "new" && raw !== "existing") {
      return res.status(400).json(fail("INVALID_SCENARIO", "AUTH_400"));
    }

    const scenario: DemoSessionScenario = raw;
    const memberId = resolveMemberIdByScenario(scenario);

    initDemoSession(memberId, scenario);

    const at = signAccessToken({ memberId });
    const rt = signRefreshToken({ memberId });

    res.cookie(ACCESS_COOKIE, at, cookieOpt(ACCESS_TTL_MS));
    res.cookie(REFRESH_COOKIE, rt, cookieOpt(REFRESH_TTL_MS));

    return res.status(200).json(ok(null, "DEMO_LOGIN_OK", "AUTH_200"));
  }
);

/**
 * GET /api/auth/me
 * - AT 검증 → demoSession 기반으로 응답
 * - ✅ 기존 프론트 호환 위해 hasPet 유지(파생값: 온보딩 완료 여부)
 */
app.get("/api/auth/me", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  ensureSession(memberId);

  const session = demoSessions[memberId];

  const selectedPetId =
    session.scenario === "existing"
      ? DEMO_PETS_BY_MEMBER[2]
          ?.slice()
          .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))[0]?.id ??
        null
      : session.pet?.id ?? null;

  return res.status(200).json(
    ok(
      {
        scenario: session.scenario, // 'new' | 'existing'
        onboarding: session.onboarding, // { petDone, routineDone }
        selectedPetId, // number | null
      },
      "ME_OK",
      "AUTH_200"
    )
  );
});

/**
 * POST /api/auth/refresh
 * - RT 검증 → 새 AT 재발급
 * - ✅ 상태 복원은 demoSession이 담당(여기서 규칙 복원 금지)
 */
app.post("/api/auth/refresh", (req: Request, res: Response) => {
  const rt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rt) {
    return res.status(401).json(fail("NO_REFRESH_TOKEN", "AUTH_401"));
  }

  try {
    const decoded = jwt.verify(rt, REFRESH_SECRET) as RefreshPayload;
    const memberId = decoded.memberId;

    ensureSession(memberId);

    const newAt = signAccessToken({ memberId });
    res.cookie(ACCESS_COOKIE, newAt, cookieOpt(ACCESS_TTL_MS));

    return res.status(200).json(ok(null, "REFRESH_OK", "AUTH_200"));
  } catch {
    return res.status(401).json(fail("INVALID_OR_EXPIRED_REFRESH", "AUTH_401"));
  }
});

/**
 * GET /api/pets
 * - existing: 고정 목데이터
 * - new: demoSession.pet 기반
 */
app.get("/api/pets", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  ensureSession(memberId);

  const session = demoSessions[memberId];

  if (session.scenario === "new") {
    const pets = session.pet ? [session.pet] : [];
    return res.status(200).json(ok(pets, "PETS_OK", "PETS_200"));
  }

  const pets = DEMO_PETS_BY_MEMBER[memberId] ?? [];
  return res.status(200).json(ok(pets, "PETS_OK", "PETS_200"));
});

type CreatePetBody = {
  name: string;
  type: Pet["type"];
  gender: Pet["gender"];
  birthDate: string; // YYYY-MM-DD
  isFavorite?: boolean;
};

app.post("/api/pets", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  ensureSession(memberId);

  const session = demoSessions[memberId];
  const body = req.body as CreatePetBody;

  // 입력 검증(최소)
  if (!body?.name || !body?.type || !body?.gender || !body?.birthDate) {
    return res.status(400).json(fail("INVALID_PET_BODY", "PETS_400"));
  }

  // 온보딩 단계: 1회만 허용 (중복 생성 방지)
  if (session.pet) {
    return res.status(409).json(fail("PET_ALREADY_EXISTS", "PETS_409"));
  }

  const created: Pet = {
    id: 101, // demo 고정(원하면 증가 로직)
    name: body.name,
    type: body.type,
    gender: body.gender,
    birthDate: body.birthDate,
    isFavorite: body.isFavorite ?? true,
  };

  session.pet = created;
  session.onboarding.petDone = true;
  session.onboarding.routineDone = false;

  // 프론트 PetApiResponse 기대 형태와 일치: { id, name, type, gender, birthDate, isFavorite }
  return res.status(201).json(ok(created, "PET_CREATED", "PETS_201"));
});

app.post(
  "/api/slots/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    ensureSession(memberId);

    const session = demoSessions[memberId];
    const petId = Number(req.params.petId);
    const body = req.body as Slot;

    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "SLOT_400"));
    }

    // 선행조건: pet 등록 먼저
    if (!session.pet) {
      return res.status(409).json(fail("PET_REQUIRED_FIRST", "SLOT_409"));
    }

    // petId 정합성(온보딩에서는 세션에 1마리만 존재)
    if (session.pet.id !== petId) {
      return res.status(404).json(fail("PET_NOT_FOUND", "SLOT_404"));
    }

    // (최소) 형태 검증: boolean 키들만 체크해도 충분
    const boolKeys: Array<keyof Slot> = [
      "feedActivated",
      "waterActivated",
      "walkActivated",
      "pottyActivated",
      "dentalActivated",
      "skinActivated",
    ];
    for (const k of boolKeys) {
      if (typeof body?.[k] !== "boolean") {
        return res.status(400).json(fail("INVALID_SLOT_BODY", "SLOT_400"));
      }
    }

    session.slotByPetId[petId] = body;
    session.onboarding.routineDone = true; // ✅ 루틴 입력 완료를 slot init 완료로 간주

    return res.status(200).json(ok(null, "SLOT_INIT_OK", "SLOT_200"));
  }
);

// GET /api/pets/:petId
app.get(
  "/api/pets/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    ensureSession(memberId);

    const petId = Number(req.params.petId);
    const session = demoSessions[memberId];

    if (session.scenario === "new") {
      const pet = session.pet && session.pet.id === petId ? session.pet : null;
      if (!pet) return res.status(404).json(fail("PET_NOT_FOUND", "PETS_404"));
      return res.status(200).json(ok(pet, "PET_OK", "PETS_200"));
    }

    const pets = DEMO_PETS_BY_MEMBER[memberId] ?? [];
    const pet = pets.find((p) => p.id === petId);

    if (!pet) {
      return res.status(404).json(fail("PET_NOT_FOUND", "PETS_404"));
    }

    return res.status(200).json(ok(pet, "PET_OK", "PETS_200"));
  }
);

// GET /api/alarms/:petId/home
app.get(
  "/api/alarms/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const petId = Number(req.params.petId);
    // demo: 일단 빈 배열
    return res.status(200).json(ok([], "ALARMS_HOME_OK", "ALARM_200"));
  }
);

// GET /api/remarks/:petId/home
app.get(
  "/api/remarks/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const petId = Number(req.params.petId);
    // demo: 일단 빈 배열
    return res.status(200).json(ok([], "REMARKS_HOME_OK", "REMARK_200"));
  }
);

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
