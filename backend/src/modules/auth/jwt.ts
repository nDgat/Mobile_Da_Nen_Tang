import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { UserRole } from "../../generated/prisma/client.js";

export interface AccessTokenPayload { userId: number; role: UserRole; }

export function createAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    { role: payload.role },
    env.jwt.accessSecret,
    { algorithm: "HS256", subject: String(payload.userId), issuer: env.jwt.issuer, audience: env.jwt.audience, expiresIn: env.jwt.accessTtlSeconds },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret, { algorithms: ["HS256"], issuer: env.jwt.issuer, audience: env.jwt.audience });
  if (typeof decoded === "string") throw new Error("JWT payload không hợp lệ.");
  const payload = decoded as JwtPayload;
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0 || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")) {
    throw new Error("JWT payload không hợp lệ.");
  }
  return { userId, role: payload.role };
}

