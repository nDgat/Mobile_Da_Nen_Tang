import { auditRepository } from "./audit.repository.js";
import { auditQuerySchema, auditWhere } from "./audit.query.js";

export async function auditLogs(input: Record<string, unknown>) {
  const query = auditQuerySchema.parse(input);
  const { page, limit } = query;
  const { items, total } = await auditRepository.findPage((page - 1) * limit, limit, auditWhere(query));
  return {
    data: items.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
