import type { NextFunction, Request, Response } from "express";
import { listConcessions } from "./concession.service.js";

export async function listConcessionsHandler(_req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await listConcessions() }); } catch (error) { next(error); }
}
