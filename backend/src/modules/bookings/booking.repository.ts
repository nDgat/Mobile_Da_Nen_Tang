import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";
import { calculateBookingPricing } from "./booking.pricing.js";
import { evaluateVoucher } from "../vouchers/voucher.pricing.js";

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
    const pricing = calculateBookingPricing(seats.map(seat => BigInt(seat.price.toString())));
    const booking = await tx.booking.create({ data: {
      userId, showtimeId, status: "PENDING", expiresAt,
      seatSubtotal: pricing.seatSubtotal.toString(), serviceFee: pricing.serviceFee.toString(),
      concessionSubtotal: pricing.concessionSubtotal.toString(), discountAmount: pricing.discountAmount.toString(),
      totalAmount: pricing.totalAmount.toString(),
    } });
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
  concessions: { orderBy: { id: "asc" as const } },
  voucher: { select: { id: true, code: true, name: true, description: true, discountType: true, discountValue: true, minOrderAmount: true, maxDiscountAmount: true } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

export const findBookingForUser = (bookingId: number, userId: number) => prisma.booking.findFirst({ where: { id: bookingId, userId }, include: bookingDetailsInclude });

export async function findBookingHistoryPage(userId: number, skip: number, take: number, status?: Prisma.BookingWhereInput["status"]) {
  const where: Prisma.BookingWhereInput = { userId, ...(status ? { status } : {}) };
  const include = {
    showtime: { include: { movie: { select: { id: true, title: true, posterUrl: true } }, room: { select: { name: true, cinema: { select: { name: true } } } } } },
    seats: { orderBy: { seatLabel: "asc" as const }, select: { seatLabel: true } },
  };
  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({ where, include, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take }),
    prisma.booking.count({ where }),
  ]);
  return { items, total };
}

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

export async function replaceBookingConcessions(bookingId: number, userId: number, items: { productId: number; quantity: number }[]) {
  return prisma.$transaction(async tx => {
    const now = new Date();
    await releaseExpiredHolds(tx, now);
    await tx.$queryRawUnsafe("SELECT id FROM `Booking` WHERE id = ? FOR UPDATE", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: { seats: true, voucher: true } });
    if (!booking) return { error: "BOOKING_NOT_FOUND" as const };
    if (booking.status === "EXPIRED") return { error: "BOOKING_EXPIRED" as const };
    if (booking.status !== "PENDING") return { error: "BOOKING_NOT_PENDING" as const };
    const productIds = items.map(item => item.productId);
    const products = productIds.length === 0 ? [] : await tx.concessionProduct.findMany({ where: { id: { in: productIds }, isActive: true } });
    if (products.length !== productIds.length) return { error: "PRODUCT_UNAVAILABLE" as const };
    const productById = new Map(products.map(product => [product.id, product]));
    const lines = items.map(item => {
      const product = productById.get(item.productId)!;
      const lineTotal = BigInt(product.price.toString()) * BigInt(item.quantity);
      return { bookingId, productId: product.id, productName: product.name, unitPrice: product.price, quantity: item.quantity, lineTotal: lineTotal.toString() };
    });
    const concessionSubtotal = lines.reduce((sum, line) => sum + BigInt(line.lineTotal), 0n);
    const beforeVoucher = calculateBookingPricing(booking.seats.map(seat => BigInt(seat.unitPrice.toString())), concessionSubtotal);
    const voucherResult = booking.voucher ? evaluateVoucher({ ...booking.voucher, discountValue: booking.voucher.discountValue.toString(), minOrderAmount: booking.voucher.minOrderAmount.toString(), maxDiscountAmount: booking.voucher.maxDiscountAmount?.toString() ?? null }, beforeVoucher.totalAmount, now) : null;
    const voucherValid = voucherResult?.valid === true;
    const pricing = calculateBookingPricing(booking.seats.map(seat => BigInt(seat.unitPrice.toString())), concessionSubtotal, voucherValid ? voucherResult.discountAmount : 0n);
    await tx.bookingConcessionItem.deleteMany({ where: { bookingId } });
    if (lines.length) await tx.bookingConcessionItem.createMany({ data: lines });
    await tx.booking.update({ where: { id: bookingId }, data: {
      seatSubtotal: pricing.seatSubtotal.toString(), serviceFee: pricing.serviceFee.toString(),
      concessionSubtotal: pricing.concessionSubtotal.toString(), discountAmount: pricing.discountAmount.toString(),
      totalAmount: pricing.totalAmount.toString(), voucherId: voucherValid ? booking.voucherId : null, voucherCode: voucherValid ? booking.voucherCode : null,
    } });
    return { booking: await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: bookingDetailsInclude }) };
  }, { timeout: 15_000 });
}

export async function applyVoucherToBooking(bookingId: number, userId: number, code: string) {
  return prisma.$transaction(async tx => {
    const now = new Date();
    await releaseExpiredHolds(tx, now);
    await tx.$queryRawUnsafe("SELECT id FROM `Booking` WHERE id = ? FOR UPDATE", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: { seats: true, concessions: true } });
    if (!booking) return { error: "BOOKING_NOT_FOUND" as const };
    if (booking.status === "EXPIRED") return { error: "BOOKING_EXPIRED" as const };
    if (booking.status !== "PENDING") return { error: "BOOKING_NOT_PENDING" as const };
    const voucher = await tx.voucher.findUnique({ where: { code } });
    if (!voucher) return { error: "VOUCHER_NOT_FOUND" as const };
    const basePricing = calculateBookingPricing(booking.seats.map(seat => BigInt(seat.unitPrice.toString())), booking.concessions.reduce((sum, line) => sum + BigInt(line.lineTotal.toString()), 0n));
    const evaluation = evaluateVoucher({ ...voucher, discountValue: voucher.discountValue.toString(), minOrderAmount: voucher.minOrderAmount.toString(), maxDiscountAmount: voucher.maxDiscountAmount?.toString() ?? null }, basePricing.totalAmount, now);
    if (!evaluation.valid) return { error: "VOUCHER_INVALID" as const, reason: evaluation.reason, minOrderAmount: voucher.minOrderAmount.toString() };
    const pricing = calculateBookingPricing(booking.seats.map(seat => BigInt(seat.unitPrice.toString())), basePricing.concessionSubtotal, evaluation.discountAmount);
    await tx.booking.update({ where: { id: booking.id }, data: { voucherId: voucher.id, voucherCode: voucher.code, discountAmount: pricing.discountAmount.toString(), totalAmount: pricing.totalAmount.toString() } });
    return { booking: await tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: bookingDetailsInclude }) };
  }, { timeout: 15_000 });
}

export async function removeVoucherFromBooking(bookingId: number, userId: number) {
  return prisma.$transaction(async tx => {
    const now = new Date();
    await releaseExpiredHolds(tx, now);
    await tx.$queryRawUnsafe("SELECT id FROM `Booking` WHERE id = ? FOR UPDATE", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: { seats: true, concessions: true } });
    if (!booking) return { error: "BOOKING_NOT_FOUND" as const };
    if (booking.status === "EXPIRED") return { error: "BOOKING_EXPIRED" as const };
    if (booking.status !== "PENDING") return { error: "BOOKING_NOT_PENDING" as const };
    const pricing = calculateBookingPricing(booking.seats.map(seat => BigInt(seat.unitPrice.toString())), booking.concessions.reduce((sum, line) => sum + BigInt(line.lineTotal.toString()), 0n));
    await tx.booking.update({ where: { id: booking.id }, data: { voucherId: null, voucherCode: null, discountAmount: 0, totalAmount: pricing.totalAmount.toString() } });
    return { booking: await tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: bookingDetailsInclude }) };
  }, { timeout: 15_000 });
}

export async function cleanupExpiredHolds() {
  return prisma.$transaction(tx => releaseExpiredHolds(tx, new Date()));
}
