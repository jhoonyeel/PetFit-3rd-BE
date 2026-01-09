import { Response, Router } from "express";
import { AuthedRequest, requireAccess } from "../middlewares/requireAccess";
import { ok } from "../types/api";

export const remarksRouter = Router();

// GET /api/remarks/:petId/home
remarksRouter.get(
  "/:petId/home",
  requireAccess,
  (req: AuthedRequest, res: Response) => {
    const petId = Number(req.params.petId);
    // demo: 일단 빈 배열
    return res.status(200).json(ok([], "REMARKS_HOME_OK", "REMARK_200"));
  }
);
