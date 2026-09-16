import { prisma } from "../../database/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });
export const findUserById = (id: number) => prisma.user.findUnique({ where: { id } });
export const insertCustomer = (data: { email: string; passwordHash: string; fullName: string }) => prisma.user.create({ data: { ...data, role: "CUSTOMER", isActive: true } });

export const insertRefreshToken = (data: { userId: number; tokenHash: string; expiresAt: Date }) => prisma.refreshToken.create({ data });

export async function rotateStoredRefreshToken(oldHash: string, newHash: string, newExpiresAt: Date) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const current = await tx.refreshToken.findUnique({ where: { tokenHash: oldHash }, include: { user: true } });
    if (!current || current.revokedAt || current.expiresAt <= new Date() || !current.user.isActive) return null;
    const revoked = await tx.refreshToken.updateMany({ where: { id: current.id, revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } });
    if (revoked.count !== 1) return null;
    await tx.refreshToken.create({ data: { userId: current.userId, tokenHash: newHash, expiresAt: newExpiresAt } });
    return current.user;
  });
}

export const revokeStoredRefreshToken = (tokenHash: string) => prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
