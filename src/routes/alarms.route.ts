import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { fail, ok } from "../types/api";
import { getSession } from "../demo/store";
import { Alarm } from "../types/demo";

export const alarmsRouter = Router();

function extractTimePart(localDateTime: string) {
  // "YYYY-MM-DDTHH:mm:ss" -> "HH:mm:ss"
  return typeof localDateTime === "string" && localDateTime.length >= 19
    ? localDateTime.slice(11, 19)
    : "00:00:00";
}

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
    const base = session.alarmsByPetId?.[petId] ?? [];

    // ✅ base(보통 오늘) 알람을 최근 3일치로 “투영”
    const expanded: Alarm[] = [];
    let seq = 0;

    for (const a of base) {
      const time = extractTimePart(a.targetDateTime);
      for (const ymd of ymdSet) {
        expanded.push({
          ...a,
          alarmId: a.alarmId * 100 + seq++, // 데모용 유니크
          targetDateTime: `${ymd}T${time}`,
        });
      }
    }

    // ✅ 최신순
    expanded.sort((a, b) => b.targetDateTime.localeCompare(a.targetDateTime));

    return res.status(200).json(ok(expanded, "ALARMS_HOME_OK", "ALARM_200"));
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
