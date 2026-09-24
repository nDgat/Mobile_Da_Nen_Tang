import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";
import { deleteMyReviewHandler, getMyReviewHandler, listReviewHandler, upsertMyReviewHandler } from "../reviews/review.controller.js";
import { validateRequest } from "../../validation/request-validation.js";
import { idParams, reviewSchemas } from "../../validation/schemas.js";

import {
  createMovieHandler,
  deleteMovieHandler,
  getMovieHandler,
  listMovieHandler,
  updateMovieHandler,
} from "./movie.controller.js";

export const movieRouter = Router();

movieRouter.get("/", listMovieHandler);
movieRouter.get("/:id/reviews", validateRequest({ params: idParams(), query: reviewSchemas.listQuery }), listReviewHandler);
movieRouter.get("/:id/reviews/me", requireAuthentication, validateRequest({ params: idParams() }), getMyReviewHandler);
movieRouter.put("/:id/reviews/me", requireAuthentication, validateRequest({ params: idParams(), body: reviewSchemas.write }), upsertMyReviewHandler);
movieRouter.delete("/:id/reviews/me", requireAuthentication, validateRequest({ params: idParams() }), deleteMyReviewHandler);
movieRouter.get("/:id", getMovieHandler);
movieRouter.post("/", requireAuthentication, requireRole("ADMIN"), createMovieHandler);
movieRouter.patch("/:id", requireAuthentication, requireRole("ADMIN"), updateMovieHandler);
movieRouter.delete("/:id", requireAuthentication, requireRole("ADMIN"), deleteMovieHandler);
