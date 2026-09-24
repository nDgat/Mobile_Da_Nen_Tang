import type { NextFunction, Request, Response } from "express";
import { payMock, PaymentConflictError, PaymentNotFoundError, PaymentValidationError } from "./payment.service.js";

export async function payMockHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await payMock(String(req.params.id), res.locals.auth.userId as number, req.body) }); }
  catch (error) {
    if (error instanceof PaymentValidationError) { res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } }); return; }
    if (error instanceof PaymentNotFoundError) { res.status(404).json({ error: { code: "PAYMENT_NOT_FOUND", message: error.message } }); return; }
    if (error instanceof PaymentConflictError) { res.status(409).json({ error: { code: "PAYMENT_CONFLICT", message: error.message } }); return; }
    next(error);
  }
}
