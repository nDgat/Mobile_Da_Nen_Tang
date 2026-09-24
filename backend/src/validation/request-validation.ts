import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { RequestValidationError } from "../errors/api-error.js";

export interface RequestSchemas { body?: ZodType; params?: ZodType; query?: ZodType; }

export function validateRequest(schemas: RequestSchemas) {
  const schema = z.object({ body: schemas.body ?? z.unknown(), params: schemas.params ?? z.unknown(), query: schemas.query ?? z.unknown() });
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: request.body, params: request.params, query: request.query });
    if (result.success) { next(); return; }
    next(new RequestValidationError(result.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message, code: issue.code }))));
  };
}
