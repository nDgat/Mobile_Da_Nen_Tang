import { findNotificationPage, readAllNotifications, readNotification } from "./notification.repository.js";

export class NotificationValidationError extends Error {}
export class NotificationNotFoundError extends Error {}

function positiveInt(value: unknown, field: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new NotificationValidationError(`${field} phải là số nguyên dương.`); return parsed; }

export async function listNotifications(userId: number, query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 20 : positiveInt(query.limit, "limit");
  if (limit > 50) throw new NotificationValidationError("limit không được lớn hơn 50.");
  if (query.unread !== undefined && query.unread !== "true" && query.unread !== "false") throw new NotificationValidationError("unread phải là true hoặc false.");
  const { items, total, unread } = await findNotificationPage(userId, (page - 1) * limit, limit, query.unread === "true");
  return { data: items.map(item => ({ ...item, readAt: item.readAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() })), meta: { page, limit, total, totalPages: Math.ceil(total / limit), unread } };
}

export async function markNotificationRead(idValue: string, userId: number) {
  if (!await readNotification(positiveInt(idValue, "ID thông báo"), userId)) throw new NotificationNotFoundError("Không tìm thấy thông báo.");
}

export async function markAllNotificationsRead(userId: number) { return (await readAllNotifications(userId)).count; }
