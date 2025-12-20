import { Router } from "express";
import { ok } from "../response.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { db } from "../store.js";

const r = Router();

r.get("/:petId/monthly/:month", requireAuth, (req, res) => {
  const petId = Number(req.params.petId);
  const month = String(req.params.month); // 'YYYY-MM'
  return res.json(ok(db.monthlyEntries(petId, month)));
});

r.get("/:petId/daily/:date", requireAuth, (req, res) => {
  const petId = Number(req.params.petId);
  const date = String(req.params.date); // 'YYYY-MM-DD'
  return res.json(ok(db.dailyEntry(petId, date)));
});

export default r;
