import type { BookingStatus, UserRole } from "../../generated/prisma/client.js";
import { findAdminBookingPage, findAdminReview, findAdminReviewPage, findAdminUser, findAdminUserPage, getDashboardData, updateAdminReviewVisibility, updateAdminUserStatus } from "./admin.repository.js";
import type { AuditContext } from "../audit/audit.types.js";

export class AdminValidationError extends Error {}
export class AdminNotFoundError extends Error {}
export class AdminConflictError extends Error {}
const ROLES = ["CUSTOMER", "ADMIN"] as const;
const BOOKING_STATUSES = ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;
function positiveInt(value: unknown, field: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new AdminValidationError(`${field} phải là số nguyên dương.`); return parsed; }
function boolean(value: unknown, field: string) { if (value !== true && value !== false) throw new AdminValidationError(`${field} phải là boolean.`); return value; }
function pageQuery(query: Record<string, unknown>) { const page = query.page === undefined ? 1 : positiveInt(query.page, "page"); const limit = query.limit === undefined ? 20 : positiveInt(query.limit, "limit"); if (limit > 100) throw new AdminValidationError("limit không được lớn hơn 100."); return { page, limit, skip: (page - 1) * limit }; }
function searchValue(value: unknown) { if (value === undefined) return undefined; if (typeof value !== "string") throw new AdminValidationError("search phải là chuỗi."); const search = value.trim(); if (search.length > 100) throw new AdminValidationError("search không được vượt quá 100 ký tự."); return search || undefined; }
const date = (value: Date) => value.toISOString();

export async function adminDashboard() {
  const data = await getDashboardData();
  return { ...data, bookingStatus: Object.fromEntries(BOOKING_STATUSES.map(status => [status, data.bookingGroups.find(item => item.status === status)?._count._all ?? 0])), recentBookings: data.recentBookings.map(item => ({ id: item.id, code: item.code, status: item.status, totalAmount: item.totalAmount.toString(), createdAt: date(item.createdAt), user: item.user, movie: item.showtime.movie })) };
}

export async function adminUsers(query: Record<string, unknown>) {
  const pagination = pageQuery(query); let role: UserRole | undefined; if (query.role !== undefined) { if (typeof query.role !== "string" || !ROLES.includes(query.role as typeof ROLES[number])) throw new AdminValidationError("role không hợp lệ."); role = query.role as UserRole; }
  let active: boolean | undefined; if (query.active !== undefined) { if (query.active !== "true" && query.active !== "false") throw new AdminValidationError("active phải là true hoặc false."); active = query.active === "true"; }
  const { items, total } = await findAdminUserPage(pagination.skip, pagination.limit, role, active, searchValue(query.search));
  return { data: items.map(item => ({ ...item, createdAt: date(item.createdAt), updatedAt: date(item.updatedAt), counts: item._count, _count: undefined })), meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } };
}

export async function setAdminUserStatus(idValue: string, actorId: number, body: unknown, audit: Omit<AuditContext, "actorId"> = {}) {
  const id = positiveInt(idValue, "ID người dùng"); if (typeof body !== "object" || body === null || Array.isArray(body)) throw new AdminValidationError("Body phải là JSON object."); const isActive = boolean((body as Record<string, unknown>).isActive, "isActive");
  const user = await findAdminUser(id); if (!user) throw new AdminNotFoundError("Không tìm thấy người dùng."); if (id === actorId && !isActive) throw new AdminConflictError("Quản trị viên không thể tự khóa tài khoản đang đăng nhập.");
  const updated = await updateAdminUserStatus(id, isActive, { actorId, ...audit }); return { ...updated, updatedAt: date(updated.updatedAt) };
}

export async function adminBookings(query: Record<string, unknown>) {
  const pagination = pageQuery(query); let status: BookingStatus | undefined; if (query.status !== undefined) { if (typeof query.status !== "string" || !BOOKING_STATUSES.includes(query.status as typeof BOOKING_STATUSES[number])) throw new AdminValidationError("status không hợp lệ."); status = query.status as BookingStatus; }
  const { items, total } = await findAdminBookingPage(pagination.skip, pagination.limit, status, searchValue(query.search));
  return { data: items.map(item => ({ id: item.id, code: item.code, status: item.status, totalAmount: item.totalAmount.toString(), createdAt: date(item.createdAt), confirmedAt: item.confirmedAt ? date(item.confirmedAt) : null, user: item.user, movie: item.showtime.movie, cinema: item.showtime.room.cinema, roomName: item.showtime.room.name, startsAt: date(item.showtime.startsAt), seats: item.seats.map(seat => seat.seatLabel) })), meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } };
}

export async function adminReviews(query: Record<string, unknown>) { const pagination = pageQuery(query); let visible: boolean | undefined; if (query.visible !== undefined) { if (query.visible !== "true" && query.visible !== "false") throw new AdminValidationError("visible phải là true hoặc false."); visible = query.visible === "true"; } const { items, total } = await findAdminReviewPage(pagination.skip, pagination.limit, visible); return { data: items.map(item => ({ ...item, createdAt: date(item.createdAt), updatedAt: date(item.updatedAt) })), meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } }; }
export async function setAdminReviewVisibility(idValue: string, actorId: number, body: unknown, audit: Omit<AuditContext, "actorId"> = {}) { const id = positiveInt(idValue, "ID đánh giá"); if (typeof body !== "object" || body === null || Array.isArray(body)) throw new AdminValidationError("Body phải là JSON object."); const isVisible = boolean((body as Record<string, unknown>).isVisible, "isVisible"); if (!await findAdminReview(id)) throw new AdminNotFoundError("Không tìm thấy đánh giá."); const item = await updateAdminReviewVisibility(id, isVisible, { actorId, ...audit }); return { ...item, createdAt: date(item.createdAt), updatedAt: date(item.updatedAt) }; }
