import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";

import {
  createMovieHandler,
  deleteMovieHandler,
  getMovieHandler,
  listMovieHandler,
  updateMovieHandler,
} from "./movie.controller.js";

export const movieRouter = Router();

movieRouter.get("/", listMovieHandler);
movieRouter.get("/:id", getMovieHandler);
movieRouter.post("/", requireAuthentication, requireRole("ADMIN"), createMovieHandler);
movieRouter.patch("/:id", requireAuthentication, requireRole("ADMIN"), updateMovieHandler);
movieRouter.delete("/:id", requireAuthentication, requireRole("ADMIN"), deleteMovieHandler);
