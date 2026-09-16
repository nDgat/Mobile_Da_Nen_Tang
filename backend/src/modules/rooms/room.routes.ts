import { Router } from "express";
import { createRoomHandler, deleteRoomHandler, getRoomHandler, listRoomHandler, updateRoomHandler } from "./room.controller.js";

export const roomRouter = Router();
roomRouter.get("/", listRoomHandler);
roomRouter.get("/:id", getRoomHandler);
roomRouter.post("/", createRoomHandler);
roomRouter.patch("/:id", updateRoomHandler);
roomRouter.delete("/:id", deleteRoomHandler);

