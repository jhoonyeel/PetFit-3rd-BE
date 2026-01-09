import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { getSession } from "../demo/store";
import { Slot } from "../types/demo";
import { fail, ok } from "../types/api";

export const slotsRouter = Router();

// POST /api/slots/:petId
slotsRouter.post(
  "/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);
    const petId = Number(req.params.petId);
    const body = req.body as Slot;

    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "SLOT_400"));
    }

    // 선행조건: pet 등록 먼저
    if (!session.pet) {
      return res.status(409).json(fail("PET_REQUIRED_FIRST", "SLOT_409"));
    }

    // petId 정합성(온보딩에서는 세션에 1마리만 존재)
    if (session.pet.id !== petId) {
      return res.status(404).json(fail("PET_NOT_FOUND", "SLOT_404"));
    }

    // (최소) 형태 검증: boolean 키들만 체크해도 충분
    const boolKeys: Array<keyof Slot> = [
      "feedActivated",
      "waterActivated",
      "walkActivated",
      "pottyActivated",
      "dentalActivated",
      "skinActivated",
    ];
    for (const k of boolKeys) {
      if (typeof body?.[k] !== "boolean") {
        return res.status(400).json(fail("INVALID_SLOT_BODY", "SLOT_400"));
      }
    }

    session.slotByPetId[petId] = body;
    session.onboarding.routineDone = true; // ✅ 루틴 입력 완료를 slot init 완료로 간주

    return res.status(200).json(ok(null, "SLOT_INIT_OK", "SLOT_200"));
  }
);

// GET /api/slots/:petId
slotsRouter.get(
  "/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);

    const petId = Number(req.params.petId);
    if (!Number.isFinite(petId)) {
      return res.status(400).json(fail("INVALID_PET_ID", "SLOT_400"));
    }

    // new 시나리오: 세션 펫이 없거나 id 불일치면 404
    if (
      session.scenario === "new" &&
      (!session.pet || session.pet.id !== petId)
    ) {
      return res.status(404).json(fail("SLOT_NOT_FOUND", "SLOT_404"));
    }

    const slot = session.slotByPetId[petId];
    if (!slot) {
      return res.status(404).json(fail("SLOT_NOT_FOUND", "SLOT_404"));
    }
    return res.status(200).json(ok(slot, "SLOT_OK", "SLOT_200"));
  }
);
