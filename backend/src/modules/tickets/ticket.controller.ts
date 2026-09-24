import type { NextFunction, Request, Response } from "express";
import { getTicket, TicketNotFoundError, TicketValidationError, verifyTicket } from "./ticket.service.js";

function handle(error: unknown, response: Response) {
  if (error instanceof TicketValidationError) { response.status(400).json({ error: { code: "INVALID_TICKET_QR", message: error.message } }); return true; }
  if (error instanceof TicketNotFoundError) { response.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: error.message } }); return true; }
  return false;
}

export async function getTicketHandler(req: Request, res: Response, next: NextFunction) { try { res.json({ data: await getTicket(String(req.params.id), res.locals.auth.userId as number) }); } catch (error) { if (!handle(error, res)) next(error); } }
export async function verifyTicketHandler(req: Request, res: Response, next: NextFunction) { try { res.json({ data: await verifyTicket(req.body) }); } catch (error) { if (!handle(error, res)) next(error); } }
