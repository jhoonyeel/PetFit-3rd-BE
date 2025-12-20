import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { fail } from "../response.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const mid = req.cookies?.[config.cookieName];
  if (!mid) {
    return res.status(401).json(fail("UNAUTHORIZED", "Unauthorized", null));
  }
  (req as any).memberId = Number(mid);
  next();
};
