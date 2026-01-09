import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE } from "../config/env";
import { fail } from "../types/api";
import { verifyAccess } from "../config/jwt";
import type { AccessPayload } from "../types/demo";

export type AuthedRequest = Request & { auth?: AccessPayload };

export function requireAccess(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const at = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!at) return res.status(401).json(fail("NO_ACCESS_TOKEN", "AUTH_401"));

  try {
    req.auth = verifyAccess(at);
    next();
  } catch {
    return res.status(401).json(fail("INVALID_OR_EXPIRED_ACCESS", "AUTH_401"));
  }
}
