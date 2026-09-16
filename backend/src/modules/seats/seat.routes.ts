import { Router } from "express";
import { createSeatHandler, deleteSeatHandler, getSeatHandler, listSeatHandler, updateSeatHandler } from "./seat.controller.js";

export const seatRouter = Router();
seatRouter.get("/", listSeatHandler);
seatRouter.get("/:id", getSeatHandler);
seatRouter.post("/", createSeatHandler);
seatRouter.patch("/:id", updateSeatHandler);
seatRouter.delete("/:id", deleteSeatHandler);

