import type { BookingStatus, UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";
import type { AuditContext } from "../audit/audit.types.js";

export async function getDashboardData() {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [users, activeUsers, activeMovies, activeCinemas, bookings, confirmedBookings, todayBookings, revenue, bookingGroups, recentBookings] = await prisma.$transaction([
    prisma.user.count(), prisma.user.count({ where: { isActive: true } }), prisma.movie.count({ where: { isActive: true } }), prisma.cinema.count({ where: { isActive: true } }),
    prisma.booking.count(), prisma.booking.count({ where: { status: "CONFIRMED" } }), prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalAmount: true } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { id: true, fullName: true, email: true } }, showtime: { include: { movie: { select: { id: true, title: true } } } } } }),
  ]);
  return { users, activeUsers, activeMovies, activeCinemas, bookings, confirmedBookings, todayBookings, revenue: revenue._sum.totalAmount?.toString() ?? "0", bookingGroups, recentBookings };
}

export async function findAdminUserPage(skip: number, take: number, role?: UserRole, active?: boolean, search?: string) {
  const where = { ...(role ? { role } : {}), ...(active === undefined ? {} : { isActive: active }), ...(search ? { OR: [{ email: { contains: search } }, { fullName: { contains: search } }] } : {}) };
  const [items, total] = await prisma.$transaction([prisma.user.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take, select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { bookings: true, reviews: true, favorites: true } } } }), prisma.user.count({ where })]);
  return { items, total };
}

export const findAdminUser = (id: number) => prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
export const updateAdminUserStatus = (id: number, isActive: boolean, audit: AuditContext) => prisma.$transaction(async transaction => {
  const before = await transaction.user.findUniqueOrThrow({ where: { id }, select: { id: true, role: true, isActive: true } });
  const updated = await transaction.user.update({ where: { id }, data: { isActive }, select: { id: true, email: true, fullName: true, role: true, isActive: true, updatedAt: true } });
  await transaction.auditLog.create({ data: { ...audit, action: "USER_STATUS_CHANGED", entityType: "User", entityId: String(id), beforeData: { role: before.role, isActive: before.isActive }, afterData: { role: updated.role, isActive: updated.isActive } } });
  return updated;
});

export async function findAdminBookingPage(skip: number, take: number, status?: BookingStatus, search?: string) {
  const where = { ...(status ? { status } : {}), ...(search ? { OR: [{ code: { contains: search } }, { user: { email: { contains: search } } }] } : {}) };
  const [items, total] = await prisma.$transaction([prisma.booking.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take, include: { user: { select: { id: true, fullName: true, email: true } }, showtime: { include: { movie: { select: { id: true, title: true } }, room: { include: { cinema: { select: { id: true, name: true } } } } } }, seats: { select: { seatLabel: true } } } }), prisma.booking.count({ where })]);
  return { items, total };
}

export async function findAdminReviewPage(skip: number, take: number, visible?: boolean) {
  const where = visible === undefined ? {} : { isVisible: visible };
  const [items, total] = await prisma.$transaction([prisma.movieReview.findMany({ where, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip, take, include: { user: { select: { id: true, fullName: true, email: true } }, movie: { select: { id: true, title: true } } } }), prisma.movieReview.count({ where })]);
  return { items, total };
}
export const findAdminReview = (id: number) => prisma.movieReview.findUnique({ where: { id }, select: { id: true } });
export const updateAdminReviewVisibility = (id: number, isVisible: boolean, audit: AuditContext) => prisma.$transaction(async transaction => {
  const before = await transaction.movieReview.findUniqueOrThrow({ where: { id }, select: { isVisible: true } });
  const updated = await transaction.movieReview.update({ where: { id }, data: { isVisible }, include: { user: { select: { id: true, fullName: true, email: true } }, movie: { select: { id: true, title: true } } } });
  await transaction.auditLog.create({ data: { ...audit, action: "REVIEW_VISIBILITY_CHANGED", entityType: "MovieReview", entityId: String(id), beforeData: { isVisible: before.isVisible }, afterData: { isVisible: updated.isVisible } } });
  return updated;
});
