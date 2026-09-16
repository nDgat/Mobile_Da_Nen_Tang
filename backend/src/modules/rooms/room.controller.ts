import type { NextFunction, Request, Response } from "express";
import {
  createRoom, deactivateRoom, getRoom, listRooms, parseRoomId, updateRoom,
  RoomConflictError, RoomNotFoundError, RoomValidationError,
} from "./room.service.js";

function known(error: unknown, response: Response): boolean {
  if (error instanceof RoomValidationError) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } }); return true; }
  if (error instanceof RoomNotFoundError) { response.status(404).json({ error: { code: "ROOM_NOT_FOUND", message: error.message } }); return true; }
  if (error instanceof RoomConflictError) { response.status(409).json({ error: { code: "ROOM_CONFLICT", message: error.message } }); return true; }
  return false;
}
async function run(response: Response, next: NextFunction, action: () => Promise<void>) {
  try { await action(); } catch (error) { if (!known(error, response)) next(error); }
}
export const listRoomHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { res.json(await listRooms(req.query as Record<string, unknown>)); });
export const getRoomHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { res.json({ data: await getRoom(parseRoomId(String(req.params.id))) }); });
export const createRoomHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { const room = await createRoom(req.body); res.location(`/api/v1/rooms/${room.id}`).status(201).json({ data: room }); });
export const updateRoomHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { res.json({ data: await updateRoom(parseRoomId(String(req.params.id)), req.body) }); });
export const deleteRoomHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { await deactivateRoom(parseRoomId(String(req.params.id))); res.status(204).send(); });

