import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  feOrigin: "https://petfit-3rd-fe.vercel.app",
  cookieName: process.env.COOKIE_NAME ?? "pf_mid",
  cookieSecure: (process.env.COOKIE_SECURE ?? "true") === "true",
  cookieSameSite: (process.env.COOKIE_SAMESITE ?? "none") as
    | "none"
    | "lax"
    | "strict",
};
