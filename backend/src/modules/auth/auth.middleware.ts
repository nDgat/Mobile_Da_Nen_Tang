import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../generated/prisma/client.js";
import { verifyAccessToken } from "./jwt.js";

export function requireAuthentication(request: Request, response: Response, next: NextFunction): void {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Thiếu access token." } });
    return;
  }
  try {
    response.locals.auth = verifyAccessToken(authorization.slice(7));
    next();
  } catch {
    response.status(401).json({ error: { code: "INVALID_ACCESS_TOKEN", message: "Access token không hợp lệ hoặc đã hết hạn." } });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (_request: Request, response: Response, next: NextFunction): void => {
    const role = response.locals.auth?.role as UserRole | undefined;
    if (!role || !allowedRoles.includes(role)) {
      response.status(403).json({ error: { code: "FORBIDDEN", message: "Bạn không có quyền thực hiện thao tác này." } });
      return;
    }
    next();
  };
}
