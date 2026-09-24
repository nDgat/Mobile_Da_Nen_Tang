import { findAuditLogPage } from "./audit.repository.js";

function positiveInt(value: unknown, fallback?: number) {
  if (value === undefined && fallback !== undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Giá trị phân trang không hợp lệ.");
  return parsed;
}

export async function auditLogs(query: Record<string, unknown>) {
  const page = positiveInt(query.page, 1);
  const limit = positiveInt(query.limit, 20);
  const actorId = query.actorId === undefined ? undefined : positiveInt(query.actorId);
  const value = (key: string) => typeof query[key] === "string" && query[key] ? String(query[key]) : undefined;
  const action = value("action");
  const entityType = value("entityType");
  const entityId = value("entityId");
  const { items, total } = await findAuditLogPage((page - 1) * limit, limit, {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
  });
  return {
    data: items.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
