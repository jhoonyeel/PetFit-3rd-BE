import { Router, type Request, type Response } from "express";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_MS,
  REFRESH_COOKIE,
  REFRESH_TTL_MS,
} from "../config/env";
import { cookieOpt } from "../config/cookie";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} from "../config/jwt";
import { ok, fail } from "../types/api";
import type { DemoLoginBody } from "../types/demo";
import {
  ensureSession,
  getExistingSelectedPetId,
  getSession,
  initDemoSession,
  resolveMemberIdByScenario,
} from "../demo/store";
import {
  requireAccess,
  type AuthedRequest,
} from "../middlewares/requireAccess";

export const authRouter = Router();

/**
 * POST /api/auth/demo-login
 * body: { scenario: "new" | "existing" }
 * - AT/RT HttpOnly 쿠키 심기
 * - demoSession 초기화
 */
authRouter.post(
  "/demo-login",
  (req: Request<unknown, unknown, DemoLoginBody>, res: Response) => {
    const raw = req.body.scenario;
    if (raw !== "new" && raw !== "existing") {
      return res.status(400).json(fail("INVALID_SCENARIO", "AUTH_400"));
    }

    const memberId = resolveMemberIdByScenario(raw);
    initDemoSession(memberId, raw);

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
 */
authRouter.get("/me", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  const session = getSession(memberId);

  const selectedPetId =
    session.scenario === "existing"
      ? getExistingSelectedPetId()
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
 * - 세션 상태 복원은 demoSession store가 담당
 */
authRouter.post("/refresh", (req: Request, res: Response) => {
  const rt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rt) return res.status(401).json(fail("NO_REFRESH_TOKEN", "AUTH_401"));

  try {
    const decoded = verifyRefresh(rt);
    const memberId = decoded.memberId;

    // 상태 복원은 demoSession이 담당
    ensureSession(memberId);

    const newAt = signAccessToken({ memberId });
    res.cookie(ACCESS_COOKIE, newAt, cookieOpt(ACCESS_TTL_MS));

    return res.status(200).json(ok(null, "REFRESH_OK", "AUTH_200"));
  } catch {
    return res.status(401).json(fail("INVALID_OR_EXPIRED_REFRESH", "AUTH_401"));
  }
});
