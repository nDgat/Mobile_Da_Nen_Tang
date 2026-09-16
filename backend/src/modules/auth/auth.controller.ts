import type { NextFunction, Request, Response } from "express";
import { EmailConflictError, registerCustomer, RegisterValidationError } from "./auth.service.js";
export async function registerHandler(req: Request, res: Response, next: NextFunction) { try { const user = await registerCustomer(req.body); res.status(201).json({ data: user }); } catch (error) { if (error instanceof RegisterValidationError) { res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } }); return; } if (error instanceof EmailConflictError) { res.status(409).json({ error: { code: "EMAIL_ALREADY_EXISTS", message: error.message } }); return; } next(error); } }

