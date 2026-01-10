import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { fail, ok } from "../types/api";
import { Remark } from "../types/demo";
import { getSession } from "../demo/store";
import { ensureDailyEntry } from "../demo/entrySSOT";

export const remarksRouter = Router();

// GET /api/remarks/:petId/home
remarksRouter.get(
  "/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "REMARK_400"));
    }

    const ymdSet = getRecentYmdSet(3);

    const remarks: Remark[] = [];

    // ✅ 최근 3일치 entry를 "존재 보장" 후 remark 수집
    for (const ymd of ymdSet) {
      const entry = ensureDailyEntry(session, petId, ymd);
      for (const r of entry.remarkResponseList) remarks.push(r);
    }

    // ✅ 최신순(내림차순)
    remarks.sort((a, b) => b.remarkDate.localeCompare(a.remarkDate));

    return res.status(200).json(ok(remarks, "REMARKS_HOME_OK", "REMARK_200"));
  }
);
