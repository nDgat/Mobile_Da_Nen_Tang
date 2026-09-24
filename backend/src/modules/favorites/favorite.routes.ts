import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { createFavoriteHandler, deleteFavoriteHandler, favoriteStatusHandler, listFavoriteHandler } from "./favorite.controller.js";
import { validateRequest } from "../../validation/request-validation.js";
import { favoriteSchemas, idParams } from "../../validation/schemas.js";

export const favoriteRouter = Router();
favoriteRouter.use(requireAuthentication);
favoriteRouter.get("/", validateRequest({ query: favoriteSchemas.listQuery }), listFavoriteHandler);
favoriteRouter.get("/:movieId", validateRequest({ params: idParams("movieId") }), favoriteStatusHandler);
favoriteRouter.put("/:movieId", validateRequest({ params: idParams("movieId") }), createFavoriteHandler);
favoriteRouter.delete("/:movieId", validateRequest({ params: idParams("movieId") }), deleteFavoriteHandler);
