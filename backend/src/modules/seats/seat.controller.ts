import type { NextFunction, Request, Response } from "express";
import { createSeat, deactivateSeat, getSeat, listSeats, parseSeatId, updateSeat, SeatConflictError, SeatNotFoundError, SeatValidationError } from "./seat.service.js";

function known(error: unknown, response: Response): boolean { if (error instanceof SeatValidationError) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } }); return true; } if (error instanceof SeatNotFoundError) { response.status(404).json({ error: { code: "SEAT_NOT_FOUND", message: error.message } }); return true; } if (error instanceof SeatConflictError) { response.status(409).json({ error: { code: "SEAT_CONFLICT", message: error.message } }); return true; } return false; }
async function run(response: Response, next: NextFunction, action: () => Promise<void>) { try { await action(); } catch (error) { if (!known(error, response)) next(error); } }
export const listSeatHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { res.json(await listSeats(req.query as Record<string, unknown>)); });
export const getSeatHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { res.json({ data: await getSeat(parseSeatId(String(req.params.id))) }); });
export const createSeatHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { const seat = await createSeat(req.body); res.location(`/api/v1/seats/${seat.id}`).status(201).json({ data: seat }); });
export const updateSeatHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { res.json({ data: await updateSeat(parseSeatId(String(req.params.id)), req.body) }); });
export const deleteSeatHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, async () => { await deactivateSeat(parseSeatId(String(req.params.id))); res.status(204).send(); });

