import { Router } from "express";
import { config } from "../config.js";
import { ok, fail } from "../response.js";
import { db } from "../store.js";

const r = Router();

/**
 * GET /auth/kakao/login?code=...
 * - stub 로그인: 쿠키로 memberId(1) 설정
 */
r.get("/kakao/login", (req, res) => {
  // code는 일단 무시(추후 실제 카카오 붙일 자리)
  const memberId = 1;

  res.cookie(config.cookieName, String(memberId), {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    // 도메인 지정 없이 host-only로 둠(EC2 도메인/서브도메인 안정)
    path: "/",
  });

  return res.json(ok(null));
});

/**
 * POST /auth/me
 * content: { memberId, newUser }
 */
r.post("/me", (req, res) => {
  const mid = req.cookies?.[config.cookieName];
  if (!mid)
    return res.status(401).json(fail("UNAUTHORIZED", "Unauthorized", null));

  const memberId = Number(mid);
  const newUser = db.isNewUser(memberId);
  return res.json(ok({ memberId, newUser }));
});

/**
 * POST /auth/refresh
 * - FE가 401이면 자동 호출하므로 반드시 존재해야 함
 */
r.post("/refresh", (req, res) => {
  const mid = req.cookies?.[config.cookieName];
  if (!mid)
    return res.status(401).json(fail("UNAUTHORIZED", "Unauthorized", null));

  // 최소: 쿠키 재발급(유지)
  res.cookie(config.cookieName, String(mid), {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/",
  });
  return res.json(ok(null));
});

export default r;
