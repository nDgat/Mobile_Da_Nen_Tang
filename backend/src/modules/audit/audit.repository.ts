import { prisma } from "../../database/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export async function findAuditLogPage(skip: number, take: number, where: Prisma.AuditLogWhereInput) {
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take,
      include: { actor: { select: { id: true, email: true, fullName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}

export const auditRepository = { findPage: findAuditLogPage };
