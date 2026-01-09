import { Router, type Response } from "express";
import {
  requireAccess,
  type AuthedRequest,
} from "../middlewares/requireAccess";
import { getSession } from "../demo/store";
import { ok, fail } from "../types/api";
import { ensureDailyEntry, isYmd } from "../demo/entrySSOT";

export const routinesRouter = Router();

routinesRouter.get(
  "/:petId/daily/:date",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    const date = req.params.date;

    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "ROUTINE_400"));
    }
    if (!isYmd(date)) {
      return res.status(400).json(fail("INVALID_DATE_FORMAT", "ROUTINE_400"));
    }

    // pet 정합성(신규 유저는 세션 pet 1마리)
    if (
      session.scenario === "new" &&
      (!session.pet || session.pet.id !== petId)
    ) {
      return res.status(200).json(ok([], "DAILY_ROUTINE_OK", "ROUTINE_200"));
    }

    // ✅ SSOT에서 루틴을 반환 (slot 없으면 ensureDailyEntry가 []로 생성)
    const entry = ensureDailyEntry(session, petId, date);

    return res
      .status(200)
      .json(ok(entry.routineResponseList, "DAILY_ROUTINE_OK", "ROUTINE_200"));
  }
);
