import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { fail, ok } from "../types/api";
import { getSession } from "../demo/store";
import { Alarm } from "../types/demo";

export const alarmsRouter = Router();

// GET /api/alarms/:petId/home
// 오늘 포함 최근 3일
alarmsRouter.get(
  "/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    if (!Number.isFinite(petId))
      return res.status(400).json(fail("INVALID_PET_ID", "ALARM_400"));

    const ymdSet = getRecentYmdSet(3);

    const alarms: Alarm[] = (session.alarmsByPetId?.[petId] ?? [])
      .filter((a) => {
        const ymd = extractYmdFromLocalDateTime(a.targetDateTime);
        return ymd ? ymdSet.has(ymd) : false; // ✅ 파싱 실패 방어
      })
      .sort((a, b) => b.targetDateTime.localeCompare(a.targetDateTime)); // 최신순

    return res.status(200).json(ok(alarms, "ALARMS_HOME_OK", "ALARM_200"));
  }
);

// GET /api/alarms/:petId
alarmsRouter.get(
  "/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    if (!Number.isFinite(petId))
      return res.status(400).json(fail("INVALID_PET_ID", "ALARM_400"));

    const alarms = session.alarmsByPetId?.[petId] ?? [];
    return res.status(200).json(ok(alarms, "ALARMS_OK", "ALARM_200"));
  }
);
