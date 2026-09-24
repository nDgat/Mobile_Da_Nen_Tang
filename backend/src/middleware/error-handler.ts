import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../errors/api-error.js";
import { logger } from "../logging/logger.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, "NOT_FOUND", `Không tìm thấy endpoint ${request.method} ${request.originalUrl}.`));
};

function normalize(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof SyntaxError && "status" in error && error.status === 400) return new ApiError(400, "MALFORMED_JSON", "Nội dung JSON không đúng cú pháp.");
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return new ApiError(409, "UNIQUE_CONFLICT", "Dữ liệu đã tồn tại.");
    if (error.code === "P2003") return new ApiError(409, "RELATION_CONFLICT", "Dữ liệu đang được sử dụng và không thể thay đổi.");
    if (error.code === "P2025") return new ApiError(404, "RESOURCE_NOT_FOUND", "Không tìm thấy dữ liệu yêu cầu.");
  }
  return new ApiError(500, "INTERNAL_SERVER_ERROR", "Đã xảy ra lỗi phía server.");
}

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) { next(error); return; }
  const normalized = normalize(error);
  const requestId = String(response.locals.requestId ?? "unknown");
  if (normalized.status >= 500) logger.error("http.request.failed", { requestId, method: request.method, path: request.path, error });
  response.status(normalized.status).json({ error: { code: normalized.code, message: normalized.message, ...(normalized.details ? { details: normalized.details } : {}), requestId } });
};
