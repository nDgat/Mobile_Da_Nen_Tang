import { Router } from "express";

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
movieRouter.post("/", createMovieHandler);
movieRouter.patch("/:id", updateMovieHandler);
movieRouter.delete("/:id", deleteMovieHandler);

