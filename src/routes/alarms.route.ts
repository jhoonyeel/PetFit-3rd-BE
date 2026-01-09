import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { fail, ok } from "../types/api";
import { getSession } from "../demo/store";

export const alarmsRouter = Router();

// GET /api/alarms/:petId/home
alarmsRouter.get(
  "/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    if (!Number.isFinite(petId))
      return res.status(400).json(fail("INVALID_PET_ID", "ALARM_400"));

    const alarms = session.alarmsByPetId?.[petId] ?? [];
    return res.status(200).json(ok(alarms, "ALARMS_HOME_OK", "ALARM_200"));
  }
);

// GET /api/alarms/:petId
alarmsRouter.get(
  "/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const petId = Number(req.params.petId);
    // demo: 일단 빈 배열
    return res.status(200).json(ok([], "ALARMS_OK", "ALARM_200"));
  }
);
