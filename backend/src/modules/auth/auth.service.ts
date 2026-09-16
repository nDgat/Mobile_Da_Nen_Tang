import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { findUserByEmail, findUserById, insertCustomer, insertRefreshToken, revokeStoredRefreshToken, rotateStoredRefreshToken } from "./auth.repository.js";
import { createAccessToken } from "./jwt.js";

export class RegisterValidationError extends Error {}
export class EmailConflictError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InactiveAccountError extends Error {}
export class InvalidRefreshTokenError extends Error {}
function bodyObject(value: unknown): Record<string, unknown> { if (typeof value !== "object" || value === null || Array.isArray(value)) throw new RegisterValidationError("Body phải là một JSON object."); return value as Record<string, unknown>; }
function text(value: unknown, field: string, max: number) { if (typeof value !== "string" || value.trim() === "") throw new RegisterValidationError(`${field} phải là chuỗi không rỗng.`); const result = value.trim(); if (result.length > max) throw new RegisterValidationError(`${field} không được vượt quá ${max} ký tự.`); return result; }
function email(value: unknown) { const result = text(value, "email", 191).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new RegisterValidationError("email không đúng định dạng."); return result; }
function password(value: unknown) { if (typeof value !== "string" || value.length < 8 || value.length > 72) throw new RegisterValidationError("password phải có từ 8 đến 72 ký tự."); if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) throw new RegisterValidationError("password phải có chữ thường, chữ hoa và chữ số."); return value; }

export async function registerCustomer(value: unknown) {
  const body = bodyObject(value);
  const normalizedEmail = email(body.email);
  const fullName = text(body.fullName, "fullName", 100);
  const rawPassword = password(body.password);
  if (await findUserByEmail(normalizedEmail)) throw new EmailConflictError("Email đã được đăng ký.");
  const user = await insertCustomer({ email: normalizedEmail, fullName, passwordHash: await hash(rawPassword, 12) });
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString() };
}

export async function login(value: unknown) {
  const body = bodyObject(value);
  const normalizedEmail = email(body.email);
  if (typeof body.password !== "string" || body.password === "") throw new InvalidCredentialsError("Email hoặc mật khẩu không đúng.");
  const user = await findUserByEmail(normalizedEmail);
  if (!user || !(await compare(body.password, user.passwordHash))) throw new InvalidCredentialsError("Email hoặc mật khẩu không đúng.");
  if (!user.isActive) throw new InactiveAccountError("Tài khoản đã ngừng hoạt động.");
  return createTokenPair(user);
}

function refreshHash(token: string): string { return createHash("sha256").update(token).digest("hex"); }
function readRefreshToken(value: unknown): string { const body = bodyObject(value); if (typeof body.refreshToken !== "string" || body.refreshToken.length < 32 || body.refreshToken.length > 512) throw new InvalidRefreshTokenError("Refresh token không hợp lệ."); return body.refreshToken; }

async function createTokenPair(user: { id: number; email: string; fullName: string; role: "CUSTOMER" | "ADMIN" }) {
  const refreshToken = randomBytes(64).toString("base64url");
  await insertRefreshToken({ userId: user.id, tokenHash: refreshHash(refreshToken), expiresAt: new Date(Date.now() + env.jwt.refreshTtlSeconds * 1000) });
  return {
    accessToken: createAccessToken({ userId: user.id, role: user.role }),
    refreshToken,
    tokenType: "Bearer",
    expiresIn: env.jwt.accessTtlSeconds,
    refreshExpiresIn: env.jwt.refreshTtlSeconds,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  };
}

export async function refreshSession(value: unknown) {
  const currentToken = readRefreshToken(value);
  const nextToken = randomBytes(64).toString("base64url");
  const user = await rotateStoredRefreshToken(refreshHash(currentToken), refreshHash(nextToken), new Date(Date.now() + env.jwt.refreshTtlSeconds * 1000));
  if (!user) throw new InvalidRefreshTokenError("Refresh token không hợp lệ hoặc đã hết hạn.");
  return {
    accessToken: createAccessToken({ userId: user.id, role: user.role }), refreshToken: nextToken,
    tokenType: "Bearer", expiresIn: env.jwt.accessTtlSeconds, refreshExpiresIn: env.jwt.refreshTtlSeconds,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  };
}

export async function logout(value: unknown): Promise<void> {
  const token = readRefreshToken(value);
  await revokeStoredRefreshToken(refreshHash(token));
}

export async function getCurrentUser(userId: number) {
  const user = await findUserById(userId);
  if (!user || !user.isActive) throw new InvalidCredentialsError("Tài khoản không còn hợp lệ.");
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive };
}
