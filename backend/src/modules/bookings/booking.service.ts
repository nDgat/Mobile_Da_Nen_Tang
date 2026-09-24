import { applyVoucherToBooking, cleanupExpiredHolds, createSeatHold, findBookingForUser, findBookingHistoryPage, releaseSeatHold, removeVoucherFromBooking, replaceBookingConcessions, submitBookingForPayment } from "./booking.repository.js";

const HOLD_DURATION_MS = 5 * 60 * 1000;
const CHECKOUT_DURATION_MS = 10 * 60 * 1000;
export class HoldValidationError extends Error {}
export class HoldConflictError extends Error {}
export class HoldNotFoundError extends Error {}

function positiveInt(value: unknown, field: string) { const parsed = typeof value === "number" ? value : Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new HoldValidationError(`${field} phải là số nguyên dương.`); return parsed; }
function seatIds(value: unknown) { if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new HoldValidationError("showtimeSeatIds phải có từ 1 đến 8 ghế."); const ids = value.map(item => positiveInt(item, "ID ghế theo suất")); if (new Set(ids).size !== ids.length) throw new HoldValidationError("Danh sách ghế không được trùng ID."); return ids; }
export const parseBookingId = (value: string) => positiveInt(value, "ID booking");

const BOOKING_STATUSES = ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;

export async function listBookingHistory(userId: number, query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 10 : positiveInt(query.limit, "limit");
  if (limit > 50) throw new HoldValidationError("limit không được lớn hơn 50.");
  const statusValue = query.status;
  if (statusValue !== undefined && (typeof statusValue !== "string" || !BOOKING_STATUSES.includes(statusValue as typeof BOOKING_STATUSES[number]))) throw new HoldValidationError("status không hợp lệ.");
  await cleanupExpiredHolds();
  const { items, total } = await findBookingHistoryPage(userId, (page - 1) * limit, limit, statusValue as typeof BOOKING_STATUSES[number] | undefined);
  return {
    data: items.map(item => ({
      id: item.id, code: item.code, status: item.status, totalAmount: item.totalAmount.toString(), createdAt: item.createdAt.toISOString(), confirmedAt: item.confirmedAt?.toISOString() ?? null,
      movie: item.showtime.movie, cinemaName: item.showtime.room.cinema.name, roomName: item.showtime.room.name,
      startsAt: item.showtime.startsAt.toISOString(), seats: item.seats.map(seat => seat.seatLabel),
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function bookingDto(item: NonNullable<Awaited<ReturnType<typeof findBookingForUser>>>) {
  return {
    id: item.id, code: item.code, status: item.status, showtimeId: item.showtimeId,
    expiresAt: item.expiresAt.toISOString(), confirmedAt: item.confirmedAt?.toISOString() ?? null,
    totalAmount: item.totalAmount.toString(), createdAt: item.createdAt.toISOString(),
    pricing: {
      seatSubtotal: item.seatSubtotal.toString(), serviceFee: item.serviceFee.toString(),
      concessionSubtotal: item.concessionSubtotal.toString(), discountAmount: item.discountAmount.toString(),
      totalAmount: item.totalAmount.toString(),
    },
    movie: item.showtime.movie,
    cinema: item.showtime.room.cinema,
    room: { id: item.showtime.room.id, name: item.showtime.room.name },
    showtime: { id: item.showtime.id, startsAt: item.showtime.startsAt.toISOString(), endsAt: item.showtime.endsAt.toISOString() },
    seats: item.seats.map(seat => ({ id: seat.showtimeSeatId, label: seat.seatLabel, price: seat.unitPrice.toString() })),
    concessions: item.concessions.map(line => ({ id: line.id, productId: line.productId, name: line.productName, unitPrice: line.unitPrice.toString(), quantity: line.quantity, lineTotal: line.lineTotal.toString() })),
    voucher: item.voucher ? {
      id: item.voucher.id, code: item.voucher.code, name: item.voucher.name, description: item.voucher.description,
      discountType: item.voucher.discountType, discountValue: item.voucher.discountValue.toString(),
      minOrderAmount: item.voucher.minOrderAmount.toString(), maxDiscountAmount: item.voucher.maxDiscountAmount?.toString() ?? null,
    } : null,
    latestPayment: item.payments[0] ? {
      id: item.payments[0].id, code: item.payments[0].code, provider: item.payments[0].provider,
      amount: item.payments[0].amount.toString(), status: item.payments[0].status,
      failureReason: item.payments[0].failureReason, completedAt: item.payments[0].completedAt.toISOString(),
    } : null,
  };
}

export async function holdSeats(userId: number, showtimeIdValue: string, body: unknown) {
  const showtimeId = positiveInt(showtimeIdValue, "ID suất chiếu");
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new HoldValidationError("Body phải là JSON object.");
  const ids = seatIds((body as Record<string, unknown>).showtimeSeatIds);
  const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
  const result = await createSeatHold(userId, showtimeId, ids, expiresAt);
  if ("error" in result) {
    if (result.error === "SHOWTIME_NOT_FOUND") throw new HoldNotFoundError("Không tìm thấy suất chiếu.");
    if (result.error === "SEATS_UNAVAILABLE") throw new HoldConflictError("Một hoặc nhiều ghế vừa được người khác giữ hoặc đặt.");
    throw new HoldValidationError(result.error === "SHOWTIME_UNAVAILABLE" ? "Suất chiếu không còn nhận đặt vé." : "Ghế không thuộc suất chiếu này.");
  }
  return {
    id: result.booking.id, code: result.booking.code, status: result.booking.status,
    showtimeId: result.booking.showtimeId, expiresAt: result.booking.expiresAt.toISOString(),
    totalAmount: result.booking.totalAmount.toString(),
    pricing: {
      seatSubtotal: result.booking.seatSubtotal.toString(), serviceFee: result.booking.serviceFee.toString(),
      concessionSubtotal: result.booking.concessionSubtotal.toString(), discountAmount: result.booking.discountAmount.toString(),
      totalAmount: result.booking.totalAmount.toString(),
    },
    seats: result.seats.map(item => ({ id: item.id, label: `${item.seat.rowLabel}${item.seat.seatNumber}`, price: item.price.toString() })),
  };
}

export async function releaseHold(bookingId: number, userId: number) {
  const result = await releaseSeatHold(bookingId, userId);
  if ("error" in result) {
    if (result.error === "BOOKING_NOT_FOUND") throw new HoldNotFoundError("Không tìm thấy lượt giữ ghế.");
    throw new HoldConflictError("Lượt giữ ghế không còn ở trạng thái chờ.");
  }
}

export async function getBooking(bookingId: number, userId: number) {
  await cleanupExpiredHolds();
  const booking = await findBookingForUser(bookingId, userId);
  if (!booking) throw new HoldNotFoundError("Không tìm thấy đơn đặt vé.");
  return bookingDto(booking);
}

export async function submitBooking(bookingId: number, userId: number) {
  const result = await submitBookingForPayment(bookingId, userId, new Date(Date.now() + CHECKOUT_DURATION_MS));
  if ("error" in result) {
    if (result.error === "BOOKING_NOT_FOUND") throw new HoldNotFoundError("Không tìm thấy đơn đặt vé.");
    if (result.error === "BOOKING_EXPIRED") throw new HoldConflictError("Lượt giữ ghế đã hết hạn.");
    if (result.error === "SEATS_NOT_HELD") throw new HoldConflictError("Ghế của đơn không còn được giữ đầy đủ.");
    throw new HoldConflictError("Đơn không còn ở trạng thái có thể xác nhận.");
  }
  return bookingDto(result.booking);
}

function concessionSelections(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new HoldValidationError("Body phải là JSON object.");
  const items = (value as Record<string, unknown>).items;
  if (!Array.isArray(items) || items.length > 10) throw new HoldValidationError("items phải là mảng có tối đa 10 sản phẩm.");
  const parsed = items.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) throw new HoldValidationError(`items[${index}] không hợp lệ.`);
    const record = item as Record<string, unknown>;
    const productId = positiveInt(record.productId, `items[${index}].productId`);
    const quantity = positiveInt(record.quantity, `items[${index}].quantity`);
    if (quantity > 10) throw new HoldValidationError("Mỗi sản phẩm chỉ được chọn tối đa 10 phần.");
    return { productId, quantity };
  });
  if (new Set(parsed.map(item => item.productId)).size !== parsed.length) throw new HoldValidationError("Sản phẩm bắp nước không được trùng lặp.");
  return parsed;
}

export async function updateBookingConcessions(bookingId: number, userId: number, body: unknown) {
  const result = await replaceBookingConcessions(bookingId, userId, concessionSelections(body));
  if ("error" in result) {
    if (result.error === "BOOKING_NOT_FOUND") throw new HoldNotFoundError("Không tìm thấy đơn đặt vé.");
    if (result.error === "PRODUCT_UNAVAILABLE") throw new HoldValidationError("Một hoặc nhiều sản phẩm không còn bán.");
    if (result.error === "BOOKING_EXPIRED") throw new HoldConflictError("Đơn đã hết hạn.");
    throw new HoldConflictError("Không thể thay đổi bắp nước sau khi đã xác nhận đơn.");
  }
  return bookingDto(result.booking);
}

function voucherCode(body: unknown) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new HoldValidationError("Body phải là JSON object.");
  const value = (body as Record<string, unknown>).code;
  if (typeof value !== "string" || value.trim() === "" || value.trim().length > 50) throw new HoldValidationError("Mã voucher phải có từ 1 đến 50 ký tự.");
  return value.trim().toUpperCase();
}

function voucherError(result: { error?: string; reason?: string; minOrderAmount?: string }): never {
  if (result.error === "BOOKING_NOT_FOUND") throw new HoldNotFoundError("Không tìm thấy đơn đặt vé.");
  if (result.error === "VOUCHER_NOT_FOUND") throw new HoldNotFoundError("Không tìm thấy mã voucher.");
  if (result.error === "BOOKING_EXPIRED") throw new HoldConflictError("Đơn đã hết hạn.");
  if (result.error === "BOOKING_NOT_PENDING") throw new HoldConflictError("Không thể thay đổi voucher sau khi đã xác nhận đơn.");
  const messages: Record<string, string> = {
    INACTIVE: "Voucher đã ngừng hoạt động.", NOT_STARTED: "Voucher chưa đến thời gian sử dụng.", EXPIRED: "Voucher đã hết hạn.",
    OUT_OF_USES: "Voucher đã hết lượt sử dụng.", MIN_ORDER: `Đơn chưa đạt giá trị tối thiểu ${Number(result.minOrderAmount ?? 0).toLocaleString("vi-VN")}đ.`, INVALID_VALUE: "Cấu hình voucher không hợp lệ.",
  };
  throw new HoldValidationError(messages[result.reason ?? ""] ?? "Voucher không hợp lệ.");
}

export async function applyBookingVoucher(bookingId: number, userId: number, body: unknown) {
  const result = await applyVoucherToBooking(bookingId, userId, voucherCode(body));
  if ("error" in result) voucherError(result);
  return bookingDto(result.booking);
}

export async function removeBookingVoucher(bookingId: number, userId: number) {
  const result = await removeVoucherFromBooking(bookingId, userId);
  if ("error" in result) voucherError(result);
  return bookingDto(result.booking);
}
