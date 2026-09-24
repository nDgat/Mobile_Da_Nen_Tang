import { prisma } from "../../database/prisma.js";

export async function findAuditLogPage(
  skip: number,
  take: number,
  filters: { actorId?: number; action?: string; entityType?: string; entityId?: string },
) {
  const where = {
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take,
      include: { actor: { select: { id: true, email: true, fullName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}
