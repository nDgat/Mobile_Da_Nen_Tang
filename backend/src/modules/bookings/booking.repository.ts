import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";

export async function releaseExpiredHolds(tx: Prisma.TransactionClient, now: Date) {
  const expired = await tx.booking.findMany({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] }, expiresAt: { lte: now } }, select: { id: true } });
  const ids = expired.map(item => item.id);
  if (ids.length === 0) return 0;
  await tx.showtimeSeat.updateMany({ where: { currentBookingId: { in: ids }, status: "HELD" }, data: { status: "AVAILABLE", currentBookingId: null, holdExpiresAt: null } });
  await tx.booking.updateMany({ where: { id: { in: ids }, status: { in: ["PENDING", "AWAITING_PAYMENT"] } }, data: { status: "EXPIRED" } });
  return ids.length;
}

export async function createSeatHold(userId: number, showtimeId: number, showtimeSeatIds: number[], expiresAt: Date) {
  return prisma.$transaction(async tx => {
    const now = new Date();
    await releaseExpiredHolds(tx, now);
    const placeholders = showtimeSeatIds.map(() => "?").join(",");
    await tx.$queryRawUnsafe(`SELECT id FROM ShowtimeSeat WHERE id IN (${placeholders}) FOR UPDATE`, ...showtimeSeatIds);
    const showtime = await tx.showtime.findUnique({ where: { id: showtimeId } });
    if (!showtime) return { error: "SHOWTIME_NOT_FOUND" as const };
    if (showtime.status !== "SCHEDULED" || showtime.startsAt <= now) return { error: "SHOWTIME_UNAVAILABLE" as const };
    const seats = await tx.showtimeSeat.findMany({ where: { id: { in: showtimeSeatIds }, showtimeId }, include: { seat: true }, orderBy: [{ seat: { rowLabel: "asc" } }, { seat: { seatNumber: "asc" } }] });
    if (seats.length !== showtimeSeatIds.length) return { error: "INVALID_SEATS" as const };
    if (seats.some(seat => seat.status !== "AVAILABLE" || seat.currentBookingId !== null)) return { error: "SEATS_UNAVAILABLE" as const };
    const totalAmount = seats.reduce((sum, seat) => sum + BigInt(seat.price.toString()), 0n);
    const booking = await tx.booking.create({ data: { userId, showtimeId, status: "PENDING", totalAmount: totalAmount.toString(), expiresAt } });
    const updated = await tx.showtimeSeat.updateMany({ where: { id: { in: showtimeSeatIds }, showtimeId, status: "AVAILABLE", currentBookingId: null }, data: { status: "HELD", currentBookingId: booking.id, holdExpiresAt: expiresAt } });
    if (updated.count !== showtimeSeatIds.length) throw new Error("Không thể khóa toàn bộ ghế đã chọn.");
    await tx.bookingSeat.createMany({ data: seats.map(item => ({ bookingId: booking.id, showtimeSeatId: item.id, unitPrice: item.price, seatLabel: `${item.seat.rowLabel}${item.seat.seatNumber}` })) });
    return { booking, seats };
  }, { timeout: 15_000 });
}

export async function releaseSeatHold(bookingId: number, userId: number) {
  return prisma.$transaction(async tx => {
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) return { error: "BOOKING_NOT_FOUND" as const };
    if (booking.status !== "PENDING" && booking.status !== "AWAITING_PAYMENT") return { error: "BOOKING_NOT_PENDING" as const };
    await tx.showtimeSeat.updateMany({ where: { currentBookingId: booking.id, status: "HELD" }, data: { status: "AVAILABLE", currentBookingId: null, holdExpiresAt: null } });
    await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
    return { released: true as const };
  });
}

const bookingDetailsInclude = {
  showtime: {
    include: {
      movie: { select: { id: true, title: true, posterUrl: true, durationMinutes: true } },
      room: { select: { id: true, name: true, cinema: { select: { id: true, name: true, address: true, city: true } } } },
    },
  },
  seats: { orderBy: { seatLabel: "asc" as const } },
};

export const findBookingForUser = (bookingId: number, userId: number) => prisma.booking.findFirst({ where: { id: bookingId, userId }, include: bookingDetailsInclude });

export async function submitBookingForPayment(bookingId: number, userId: number, expiresAt: Date) {
  return prisma.$transaction(async tx => {
    const now = new Date();
    await releaseExpiredHolds(tx, now);
    await tx.$queryRawUnsafe("SELECT id FROM `Booking` WHERE id = ? FOR UPDATE", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: { ...bookingDetailsInclude, currentSeats: true } });
    if (!booking) return { error: "BOOKING_NOT_FOUND" as const };
    if (booking.status === "AWAITING_PAYMENT") return { booking };
    if (booking.status === "EXPIRED") return { error: "BOOKING_EXPIRED" as const };
    if (booking.status !== "PENDING") return { error: "BOOKING_NOT_PENDING" as const };
    if (booking.currentSeats.length !== booking.seats.length || booking.currentSeats.some(seat => seat.status !== "HELD")) return { error: "SEATS_NOT_HELD" as const };
    await tx.booking.update({ where: { id: booking.id }, data: { status: "AWAITING_PAYMENT", expiresAt } });
    await tx.showtimeSeat.updateMany({ where: { currentBookingId: booking.id, status: "HELD" }, data: { holdExpiresAt: expiresAt } });
    const updated = await tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: bookingDetailsInclude });
    return { booking: updated };
  }, { timeout: 15_000 });
}

export async function cleanupExpiredHolds() {
  return prisma.$transaction(tx => releaseExpiredHolds(tx, new Date()));
}
