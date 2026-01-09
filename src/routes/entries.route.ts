import { Router, type Response } from "express";
import {
  requireAccess,
  type AuthedRequest,
} from "../middlewares/requireAccess";
import { getSession } from "../demo/store";
import { ok, fail } from "../types/api";
import type { DailyEntry, DemoSession, MonthlyEntry } from "../types/demo";
import {
  ensureDailyEntry,
  ensureMonthEntries,
  isYm,
  isYmd,
  ymdToYm,
} from "../demo/entrySSOT";

export const entriesRouter = Router();

// GET /api/entries/:petId/daily/:date
entriesRouter.get(
  "/:petId/daily/:date",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    const date = req.params.date;

    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "ENTRY_400"));
    }
    if (!isYmd(date)) {
      return res.status(400).json(fail("INVALID_DATE_FORMAT", "ENTRY_400"));
    }

    // ✅ 데모 정책(권장): 불일치여도 200 + 빈 엔트리
    if (
      session.scenario === "new" &&
      (!session.pet || session.pet.id !== petId)
    ) {
      const empty: DailyEntry = {
        entryDate: date,
        routineResponseList: [],
        remarkResponseList: [],
      };
      return res.status(200).json(ok(empty, "DAILY_ENTRY_OK", "ENTRY_200"));
    }

    const entry = ensureDailyEntry(session, petId, date);
    return res.status(200).json(ok(entry, "DAILY_ENTRY_OK", "ENTRY_200"));
  }
);

// GET /api/entries/:petId/monthly/:ym (YYYY-MM)
entriesRouter.get(
  "/:petId/monthly/:ym",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    const ym = req.params.ym;

    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "ENTRY_400"));
    }
    if (!isYm(ym)) {
      return res.status(400).json(fail("INVALID_MONTH_FORMAT", "ENTRY_400"));
    }

    // ✅ 월간 요청 시 해당 월의 모든 날짜 엔트리를 미리 생성(캐시)
    // slot이 있으면 루틴도 같이 생성됨
    ensureMonthEntries(session, petId, ym);

    const dayMap: Record<string, DailyEntry | undefined> =
      session.entriesByPetId?.[petId] ?? {};

    const list: MonthlyEntry[] = Object.values(dayMap)
      .filter((e): e is DailyEntry => !!e && ymdToYm(e.entryDate) === ym)
      .map((e) => ({
        entryDate: e.entryDate,
        completed:
          e.routineResponseList.length > 0 &&
          e.routineResponseList.every((r) => r.status === "CHECKED"),
        memo: e.routineResponseList.some(
          (r) => r.status === "MEMO" || (r.content?.trim?.() ?? "") !== ""
        ),
        remarked: e.remarkResponseList.length > 0,
      }));

    return res.status(200).json(ok(list, "MONTHLY_ENTRY_OK", "ENTRY_200"));
  }
);
