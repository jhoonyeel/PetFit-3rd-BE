import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config.js";
import { fail, ok } from "./response.js";

import authRoutes from "./routes/auth.js";
import petsRoutes from "./routes/pets.js";
import remarksRoutes from "./routes/remarks.js";
import entriesRoutes from "./routes/entries.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use(
    cors({
      origin: config.feOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  );

  app.get("/health", (_req, res) => res.json(ok({ status: "ok" })));

  app.use("/auth", authRoutes);
  app.use("/pets", petsRoutes);
  app.use("/remarks", remarksRoutes);
  app.use("/entries", entriesRoutes);

  // 404
  app.use((_req, res) =>
    res.status(404).json(fail("NOT_FOUND", "Not Found", null))
  );

  // error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json(fail("INTERNAL_ERROR", "Internal Server Error", null));
  });

  return app;
};
