import type { NextFunction, Request, Response } from "express";
import { logger } from "../logging/logger.js";

export function requestLogger(request: Request, response: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  let completed = false;
  response.on("finish", () => {
    completed = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const metadata = { requestId: String(response.locals.requestId ?? "unknown"), method: request.method, path: request.path, status: response.statusCode, durationMs: Number(durationMs.toFixed(2)), userId: response.locals.auth?.userId, role: response.locals.auth?.role };
    if (response.statusCode >= 400) logger.warn("http.request.completed", metadata); else logger.info("http.request.completed", metadata);
  });
  response.on("close", () => { if (!completed) logger.warn("http.request.aborted", { requestId: String(response.locals.requestId ?? "unknown"), method: request.method, path: request.path }); });
  next();
}
