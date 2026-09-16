import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";
import { createRoomHandler, deleteRoomHandler, getRoomHandler, listRoomHandler, updateRoomHandler } from "./room.controller.js";

export const roomRouter = Router();
roomRouter.get("/", listRoomHandler);
roomRouter.get("/:id", getRoomHandler);
roomRouter.post("/", requireAuthentication, requireRole("ADMIN"), createRoomHandler);
roomRouter.patch("/:id", requireAuthentication, requireRole("ADMIN"), updateRoomHandler);
roomRouter.delete("/:id", requireAuthentication, requireRole("ADMIN"), deleteRoomHandler);
