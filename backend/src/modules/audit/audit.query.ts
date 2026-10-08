import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  actorId: z.coerce.number().int().positive().optional(),
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  message: "Ngày kết thúc phải từ ngày bắt đầu trở đi.", path: ["to"],
});

export function auditWhere(query: z.infer<typeof auditQuerySchema>): Prisma.AuditLogWhereInput {
  // Dates in the admin UI are calendar days in Vietnam, inclusive at both ends.
  const from = query.from ? new Date(query.from + "T00:00:00+07:00") : undefined;
  const until = query.to ? new Date(new Date(query.to + "T00:00:00+07:00").getTime() + 86400000) : undefined;
  return {
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(from || until ? { createdAt: { ...(from ? { gte: from } : {}), ...(until ? { lt: until } : {}) } } : {}),
    ...(query.search ? { OR: [
      { actor: { fullName: { contains: query.search } } },
      { actor: { email: { contains: query.search } } },
      { action: { contains: query.search } },
      { entityId: { contains: query.search } },
      { requestId: { contains: query.search } },
    ] } : {}),
  };
}

