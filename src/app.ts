import express from "express";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes";
import { ok } from "./types/api";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", apiRouter);

  app.get("/api/health", (_req, res) =>
    res.status(200).json(ok({ ok: true }, "HEALTH_OK", "SYS_200"))
  );
  return app;
}
