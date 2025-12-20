import { Router } from "express";
import { ok, fail } from "../response.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { db } from "../store.js";

const r = Router();

r.get("/:petId/home", requireAuth, (req, res) => {
  const petId = Number(req.params.petId);
  const list = db
    .listRemarksByPet(petId)
    .sort((a, b) => (a.remarkDate < b.remarkDate ? 1 : -1))
    .slice(0, 3)
    .map(({ petId: _, ...pure }) => pure);

  return res.json(ok(list));
});

r.post("/:petId", requireAuth, (req, res) => {
  const petId = Number(req.params.petId);
  const { title, content, remarkDate } = req.body ?? {};
  if (!title || !content || !remarkDate) {
    return res
      .status(400)
      .json(fail("BAD_REQUEST", "Invalid remark payload", null));
  }
  const created = db.createRemark(petId, { title, content, remarkDate });
  return res.json(ok(created));
});

r.patch("/:remarkId", requireAuth, (req, res) => {
  const remarkId = Number(req.params.remarkId);
  const { title, content } = req.body ?? {};
  if (!title || !content) {
    return res
      .status(400)
      .json(fail("BAD_REQUEST", "Invalid remark patch", null));
  }
  const updated = db.updateRemark(remarkId, { title, content });
  if (!updated)
    return res.status(404).json(fail("NOT_FOUND", "Remark not found", null));
  return res.json(ok(updated));
});

r.delete("/:remarkId", requireAuth, (req, res) => {
  const remarkId = Number(req.params.remarkId);
  const deleted = db.deleteRemark(remarkId);
  if (!deleted)
    return res.status(404).json(fail("NOT_FOUND", "Remark not found", null));
  return res.json(ok("deleted"));
});

export default r;
