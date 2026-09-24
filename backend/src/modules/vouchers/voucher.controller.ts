import type { NextFunction, Request, Response } from "express";
import { listVouchers } from "./voucher.service.js";

export async function listVouchersHandler(_req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await listVouchers() }); } catch (error) { next(error); }
}
