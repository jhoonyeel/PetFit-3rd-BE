import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 3000);
export const IS_PROD = process.env.NODE_ENV === "production";

export const ACCESS_SECRET =
  process.env.ACCESS_SECRET ?? "petfit-demo-access-secret";
export const REFRESH_SECRET =
  process.env.REFRESH_SECRET ?? "petfit-demo-refresh-secret";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export const ACCESS_TTL_MS = 15 * 60 * 1000; // 15m
export const REFRESH_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14d
