import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { ok } from "../types/api";

export const alarmsRouter = Router();

// GET /api/alarms/:petId/home
alarmsRouter.get(
  "/api/alarms/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const petId = Number(req.params.petId);
    // demo: 일단 빈 배열
    return res.status(200).json(ok([], "ALARMS_HOME_OK", "ALARM_200"));
  }
);
