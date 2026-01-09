import jwt from "jsonwebtoken";
import { ACCESS_SECRET, REFRESH_SECRET } from "./env";
import type { AccessPayload, RefreshPayload } from "../types/demo";

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: RefreshPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "14d" });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}
