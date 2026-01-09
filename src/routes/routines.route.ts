import { Router, type Response } from "express";
import {
  requireAccess,
  type AuthedRequest,
} from "../middlewares/requireAccess";
import { getSession } from "../demo/store";
import { ok, fail } from "../types/api";
import { Routine } from "../types/demo";

export const routinesRouter = Router();

// 간단 날짜 검증: YYYY-MM-DD
function isYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// 데모: 루틴ID 발급(서버 재시작시 초기화되어도 데모면 OK)
let routineSeq = 1000;

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
    if (session.scenario === "new") {
      if (!session.pet || session.pet.id !== petId) {
        // ✅ 데모 정책: "없음"도 200 + []로
        return res.status(200).json(ok([], "DAILY_ROUTINE_OK", "ROUTINE_200"));
      }
    }

    // 슬롯 없으면 루틴도 없음
    const slot = session.slotByPetId[petId];
    if (!slot) {
      return res.status(200).json(ok([], "DAILY_ROUTINE_OK", "ROUTINE_200"));
    }

    // 활성화된 슬롯만 루틴 생성
    const routines: Routine[] = [];

    if (slot.feedActivated) {
      routines.push({
        routineId: routineSeq++,
        category: "feed",
        status: "UNCHECKED",
        targetAmount: slot.feedAmount,
        actualAmount: 0,
        content: "",
        date,
      });
    }

    if (slot.waterActivated) {
      routines.push({
        routineId: routineSeq++,
        category: "water",
        status: "UNCHECKED",
        targetAmount: slot.waterAmount,
        actualAmount: 0,
        content: "",
        date,
      });
    }

    if (slot.walkActivated) {
      routines.push({
        routineId: routineSeq++,
        category: "walk",
        status: "UNCHECKED",
        targetAmount: slot.walkAmount,
        actualAmount: 0,
        content: "",
        date,
      });
    }

    if (slot.pottyActivated) {
      routines.push({
        routineId: routineSeq++,
        category: "potty",
        status: "UNCHECKED",
        targetAmount: 0,
        actualAmount: 0,
        content: "",
        date,
      });
    }

    if (slot.dentalActivated) {
      routines.push({
        routineId: routineSeq++,
        category: "dental",
        status: "UNCHECKED",
        targetAmount: 0,
        actualAmount: 0,
        content: "",
        date,
      });
    }

    if (slot.skinActivated) {
      routines.push({
        routineId: routineSeq++,
        category: "skin",
        status: "UNCHECKED",
        targetAmount: 0,
        actualAmount: 0,
        content: "",
        date,
      });
    }

    return res
      .status(200)
      .json(ok(routines, "DAILY_ROUTINE_OK", "ROUTINE_200"));
  }
);
