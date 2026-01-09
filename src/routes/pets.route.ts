import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { getSession } from "../demo/store";
import { fail, ok } from "../types/api";
import { Pet } from "../types/demo";
import { DEFAULT_NEW_SLOT, DEMO_PETS_BY_MEMBER } from "../demo/data";

export const petsRouter = Router();

/**
 * GET /api/pets
 * - existing: 고정 목데이터
 * - new: demoSession.pet 기반
 */
petsRouter.get("/", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  const session = getSession(memberId);

  if (session.scenario === "new") {
    const pets = session.pet ? [session.pet] : [];
    return res.status(200).json(ok(pets, "PETS_OK", "PETS_200"));
  }

  const pets = DEMO_PETS_BY_MEMBER[memberId] ?? [];
  return res.status(200).json(ok(pets, "PETS_OK", "PETS_200"));
});

type CreatePetBody = {
  name: string;
  type: Pet["type"];
  gender: Pet["gender"];
  birthDate: string; // YYYY-MM-DD
  isFavorite?: boolean;
};

petsRouter.post("/", requireAccess, (req: AuthedRequest, res: Response) => {
  const { memberId } = req.auth!;
  const session = getSession(memberId);

  const body = req.body as CreatePetBody;

  // 입력 검증(최소)
  if (!body?.name || !body?.type || !body?.gender || !body?.birthDate) {
    return res.status(400).json(fail("INVALID_PET_BODY", "PETS_400"));
  }

  // 온보딩 단계: 1회만 허용 (중복 생성 방지)
  if (session.pet) {
    return res.status(409).json(fail("PET_ALREADY_EXISTS", "PETS_409"));
  }

  const created: Pet = {
    id: 101, // demo 고정(원하면 증가 로직)
    name: body.name,
    type: body.type,
    gender: body.gender,
    birthDate: body.birthDate,
    isFavorite: body.isFavorite ?? true,
  };

  // ✅ 신규 유저: 펫 생성 직후 기본 슬롯 강제 주입
  session.slotByPetId[created.id] = DEFAULT_NEW_SLOT;

  session.pet = created;
  session.onboarding.petDone = true;
  session.onboarding.routineDone = false;

  // 프론트 PetApiResponse 기대 형태와 일치: { id, name, type, gender, birthDate, isFavorite }
  return res.status(201).json(ok(created, "PET_CREATED", "PETS_201"));
});

// GET /api/pets/:petId
petsRouter.get(
  "/:petId",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const { memberId } = req.auth!;
    const session = getSession(memberId);
    const petId = Number(req.params.petId);

    if (session.scenario === "new") {
      const pet = session.pet && session.pet.id === petId ? session.pet : null;
      if (!pet) return res.status(404).json(fail("PET_NOT_FOUND", "PETS_404"));
      return res.status(200).json(ok(pet, "PET_OK", "PETS_200"));
    }

    const pets = DEMO_PETS_BY_MEMBER[memberId] ?? [];
    const pet = pets.find((p) => p.id === petId);

    if (!pet) {
      return res.status(404).json(fail("PET_NOT_FOUND", "PETS_404"));
    }

    return res.status(200).json(ok(pet, "PET_OK", "PETS_200"));
  }
);
