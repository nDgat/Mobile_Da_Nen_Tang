import { Router } from "express";

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
cinemaRouter.post("/", createCinemaHandler);
cinemaRouter.patch("/:id", updateCinemaHandler);
cinemaRouter.delete("/:id", deleteCinemaHandler);

