import { Router } from "express";
import { authRouter } from "./auth.route";
import { petsRouter } from "./pets.route";
import { slotsRouter } from "./slots.route";
import { alarmsRouter } from "./alarms.route";
import { remarksRouter } from "./remarks.route";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/pets", petsRouter);
apiRouter.use("/slots", slotsRouter);
apiRouter.use("/alarms", alarmsRouter);
apiRouter.use("/remarks", remarksRouter);
