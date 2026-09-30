import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const configuredOrigins = new Set(env.corsOrigins);

function isAllowed(origin: string): boolean {
  if (configuredOrigins.has(origin.replace(/\/$/, ""))) return true;
  return env.nodeEnv !== "production";
}

export function cors(request: Request, response: Response, next: NextFunction): void {
  const origin = request.get("origin");
  if (origin && isAllowed(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Request-Id");
    response.setHeader("Access-Control-Expose-Headers", "X-Request-Id");
    response.setHeader("Access-Control-Max-Age", "600");
  }
  if (request.method === "OPTIONS") {
    response.sendStatus(origin && !isAllowed(origin) ? 403 : 204);
    return;
  }
  next();
}
