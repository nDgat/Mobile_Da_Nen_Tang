import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";

import {
  createCinemaHandler,
  deleteCinemaHandler,
  getCinemaHandler,
  listCinemaHandler,
  updateCinemaHandler,
} from "./cinema.controller.js";

export const cinemaRouter = Router();

cinemaRouter.get("/", listCinemaHandler);
cinemaRouter.get("/:id", getCinemaHandler);
cinemaRouter.post("/", requireAuthentication, requireRole("ADMIN"), createCinemaHandler);
cinemaRouter.patch("/:id", requireAuthentication, requireRole("ADMIN"), updateCinemaHandler);
cinemaRouter.delete("/:id", requireAuthentication, requireRole("ADMIN"), deleteCinemaHandler);
