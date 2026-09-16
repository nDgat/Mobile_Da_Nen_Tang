import { Router } from "express";
import { createShowtimeHandler, getShowtimeHandler, listShowtimeHandler, statusShowtimeHandler } from "./showtime.controller.js";
export const showtimeRouter = Router();
showtimeRouter.get("/", listShowtimeHandler);
showtimeRouter.get("/:id", getShowtimeHandler);
showtimeRouter.post("/", createShowtimeHandler);
showtimeRouter.patch("/:id/status", statusShowtimeHandler);

