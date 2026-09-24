import { z } from "zod";

const positiveInteger = z.coerce.number().int("Phải là số nguyên.").positive("Phải lớn hơn 0.");
const page = positiveInteger.optional();
const limit50 = positiveInteger.max(50, "Không được lớn hơn 50.").optional();
const limit100 = positiveInteger.max(100, "Không được lớn hơn 100.").optional();
export const idParams = (key = "id") => z.object({ [key]: positiveInteger });

export const authSchemas = {
  register: z.object({ fullName: z.string().trim().min(1, "Họ tên không được để trống.").max(100), email: z.email("Email không đúng định dạng.").max(191), password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(72).regex(/[a-z]/, "Cần chữ thường.").regex(/[A-Z]/, "Cần chữ hoa.").regex(/\d/, "Cần chữ số.") }).strict(),
  login: z.object({ email: z.email("Email không đúng định dạng.").max(191), password: z.string().min(1, "Mật khẩu không được để trống.").max(72) }).strict(),
  refresh: z.object({ refreshToken: z.string().min(32, "Refresh token không hợp lệ.").max(512) }).strict(),
};

export const bookingSchemas = {
  historyQuery: z.object({ page, limit: limit50, status: z.enum(["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"]).optional() }),
  concessions: z.object({ items: z.array(z.object({ productId: positiveInteger, quantity: positiveInteger.max(10) }).strict()).max(10) }).strict(),
  voucher: z.object({ code: z.string().trim().min(1).max(50) }).strict(),
  payment: z.object({ outcome: z.enum(["SUCCESS", "FAILURE", "CANCEL"]) }).strict(),
};

export const reviewSchemas = {
  listQuery: z.object({ page, limit: limit50 }),
  write: z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).nullable().optional() }).strict(),
};

export const favoriteSchemas = { listQuery: z.object({ page, limit: limit50 }) };
export const notificationSchemas = { listQuery: z.object({ page, limit: limit50, unread: z.enum(["true", "false"]).optional() }) };
export const adminSchemas = {
  userQuery: z.object({ page, limit: limit100, role: z.enum(["CUSTOMER", "ADMIN"]).optional(), active: z.enum(["true", "false"]).optional(), search: z.string().trim().max(100).optional() }),
  bookingQuery: z.object({ page, limit: limit100, status: z.enum(["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"]).optional(), search: z.string().trim().max(100).optional() }),
  reviewQuery: z.object({ page, limit: limit100, visible: z.enum(["true", "false"]).optional() }),
  statusBody: z.object({ isActive: z.boolean() }).strict(),
  visibilityBody: z.object({ isVisible: z.boolean() }).strict(),
  auditQuery: z.object({ page, limit: limit100, actorId: positiveInteger.optional(), action: z.string().trim().max(100).optional(), entityType: z.string().trim().max(100).optional(), entityId: z.string().trim().max(100).optional() }),
};
