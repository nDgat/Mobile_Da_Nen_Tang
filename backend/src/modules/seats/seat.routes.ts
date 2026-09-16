import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";
import { createSeatHandler, deleteSeatHandler, getSeatHandler, listSeatHandler, updateSeatHandler } from "./seat.controller.js";

export const seatRouter = Router();
seatRouter.get("/", listSeatHandler);
seatRouter.get("/:id", getSeatHandler);
seatRouter.post("/", requireAuthentication, requireRole("ADMIN"), createSeatHandler);
seatRouter.patch("/:id", requireAuthentication, requireRole("ADMIN"), updateSeatHandler);
seatRouter.delete("/:id", requireAuthentication, requireRole("ADMIN"), deleteSeatHandler);
