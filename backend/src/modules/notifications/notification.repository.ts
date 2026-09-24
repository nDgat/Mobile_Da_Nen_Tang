import { prisma } from "../../database/prisma.js";

export async function findNotificationPage(userId: number, skip: number, take: number, unreadOnly: boolean) {
  const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, total, unread };
}

export async function readNotification(notificationId: number, userId: number) {
  const result = await prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true, readAt: new Date() } });
  return result.count === 1;
}

export const readAllNotifications = (userId: number) => prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
