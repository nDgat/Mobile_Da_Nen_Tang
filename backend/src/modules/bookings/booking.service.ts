import { cleanupExpiredHolds, createSeatHold, findBookingForUser, releaseSeatHold, submitBookingForPayment } from "./booking.repository.js";

const HOLD_DURATION_MS = 5 * 60 * 1000;
const CHECKOUT_DURATION_MS = 10 * 60 * 1000;
export class HoldValidationError extends Error {}
export class HoldConflictError extends Error {}
export class HoldNotFoundError extends Error {}

function positiveInt(value: unknown, field: string) { const parsed = typeof value === "number" ? value : Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new HoldValidationError(`${field} phải là số nguyên dương.`); return parsed; }
function seatIds(value: unknown) { if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new HoldValidationError("showtimeSeatIds phải có từ 1 đến 8 ghế."); const ids = value.map(item => positiveInt(item, "ID ghế theo suất")); if (new Set(ids).size !== ids.length) throw new HoldValidationError("Danh sách ghế không được trùng ID."); return ids; }
export const parseBookingId = (value: string) => positiveInt(value, "ID booking");

function bookingDto(item: NonNullable<Awaited<ReturnType<typeof findBookingForUser>>>) {
  return {
    id: item.id, code: item.code, status: item.status, showtimeId: item.showtimeId,
    expiresAt: item.expiresAt.toISOString(), confirmedAt: item.confirmedAt?.toISOString() ?? null,
    totalAmount: item.totalAmount.toString(), createdAt: item.createdAt.toISOString(),
    movie: item.showtime.movie,
    cinema: item.showtime.room.cinema,
    room: { id: item.showtime.room.id, name: item.showtime.room.name },
    showtime: { id: item.showtime.id, startsAt: item.showtime.startsAt.toISOString(), endsAt: item.showtime.endsAt.toISOString() },
    seats: item.seats.map(seat => ({ id: seat.showtimeSeatId, label: seat.seatLabel, price: seat.unitPrice.toString() })),
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
