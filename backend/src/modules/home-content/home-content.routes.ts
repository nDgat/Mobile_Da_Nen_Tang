import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";
import { createHomeContentHandler, listHomeContentHandler, updateHomeContentHandler } from "./home-content.controller.js";

export const homeContentRouter = Router();
homeContentRouter.get("/", listHomeContentHandler);
homeContentRouter.post("/", requireAuthentication, requireRole("ADMIN"), createHomeContentHandler);
homeContentRouter.patch("/:id", requireAuthentication, requireRole("ADMIN"), updateHomeContentHandler);
