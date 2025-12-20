import { Router } from "express";
import { ok, fail } from "../response.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { db } from "../store.js";

const r = Router();

r.get("/list", requireAuth, (req, res) => {
  const memberId = (req as any).memberId as number;
  const list = db.listPetsByMember(memberId).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    isFavorite: p.isFavorite,
  }));
  return res.json(ok(list));
});

r.post("/", requireAuth, (req, res) => {
  // FE가 memberId를 payload에 넣지만, 서버에서는 쿠키의 memberId를 신뢰
  const memberId = (req as any).memberId as number;
  const { name, type, gender, birthDate, isFavorite } = req.body ?? {};

  if (!name || !type || !gender || !birthDate) {
    return res
      .status(400)
      .json(fail("BAD_REQUEST", "Invalid pet payload", null));
  }

  const pet = db.createPet({
    memberId,
    name,
    type,
    gender,
    birthDate,
    isFavorite: isFavorite ?? true,
  });

  // FE의 PetApiResponse shape
  return res.json(
    ok({
      id: pet.id,
      name: pet.name,
      type: pet.type,
      gender: pet.gender,
      birthDate: pet.birthDate,
      isFavorite: pet.isFavorite,
    })
  );
});

r.get("/:petId", requireAuth, (req, res) => {
  const petId = Number(req.params.petId);
  const pet = db.getPet(petId);
  if (!pet)
    return res.status(404).json(fail("NOT_FOUND", "Pet not found", null));

  return res.json(
    ok({
      id: pet.id,
      name: pet.name,
      type: pet.type,
      gender: pet.gender,
      birthDate: pet.birthDate,
      isFavorite: pet.isFavorite,
    })
  );
});

export default r;
