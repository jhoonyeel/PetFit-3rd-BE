import { IS_PROD } from "./env";

export function cookieOpt(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}
