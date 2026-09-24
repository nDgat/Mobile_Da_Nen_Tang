import { prisma } from "../../database/prisma.js";
import { releaseExpiredHolds } from "../bookings/booking.repository.js";
import { evaluateVoucher } from "../vouchers/voucher.pricing.js";

export type MockPaymentOutcome = "SUCCESS" | "FAILURE" | "CANCEL";

export async function processMockPayment(bookingId: number, userId: number, outcome: MockPaymentOutcome) {
  return prisma.$transaction(async tx => {
    const now = new Date();
    await releaseExpiredHolds(tx, now);
    await tx.$queryRawUnsafe("SELECT id FROM `Booking` WHERE id = ? FOR UPDATE", bookingId);
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: { seats: true, currentSeats: true, voucher: true, payments: { orderBy: { createdAt: "desc" } } } });
    if (!booking) return { error: "BOOKING_NOT_FOUND" as const };
    if (booking.status === "CONFIRMED") {
      const payment = booking.payments.find(item => item.status === "SUCCEEDED");
      return payment ? { payment, bookingStatus: booking.status, idempotent: true as const } : { error: "BOOKING_NOT_PAYABLE" as const };
    }
    if (booking.status === "EXPIRED") return { error: "BOOKING_EXPIRED" as const };
    if (booking.status !== "AWAITING_PAYMENT") return { error: "BOOKING_NOT_PAYABLE" as const };
    if (outcome !== "SUCCESS") {
      const payment = await tx.payment.create({ data: {
        bookingId: booking.id, amount: booking.totalAmount, status: outcome === "FAILURE" ? "FAILED" : "CANCELLED",
        failureReason: outcome === "FAILURE" ? "Giao dịch giả lập bị từ chối." : "Người dùng hủy giao dịch giả lập.",
      } });
      return { payment, bookingStatus: booking.status, idempotent: false as const };
    }
    if (booking.currentSeats.length !== booking.seats.length || booking.currentSeats.some(seat => seat.status !== "HELD")) return { error: "SEATS_NOT_HELD" as const };
    if (booking.voucher) {
      await tx.$queryRawUnsafe("SELECT id FROM `Voucher` WHERE id = ? FOR UPDATE", booking.voucher.id);
      const voucher = await tx.voucher.findUniqueOrThrow({ where: { id: booking.voucher.id } });
      const beforeDiscount = BigInt(booking.totalAmount.toString()) + BigInt(booking.discountAmount.toString());
      const evaluation = evaluateVoucher({ ...voucher, discountValue: voucher.discountValue.toString(), minOrderAmount: voucher.minOrderAmount.toString(), maxDiscountAmount: voucher.maxDiscountAmount?.toString() ?? null }, beforeDiscount, now);
      if (!evaluation.valid || evaluation.discountAmount !== BigInt(booking.discountAmount.toString())) return { error: "VOUCHER_INVALID" as const };
    }
    const payment = await tx.payment.create({ data: { bookingId: booking.id, amount: booking.totalAmount, status: "SUCCEEDED" } });
    const seats = await tx.showtimeSeat.updateMany({ where: { currentBookingId: booking.id, status: "HELD" }, data: { status: "BOOKED", holdExpiresAt: null } });
    if (seats.count !== booking.seats.length) throw new Error("Không thể xác nhận toàn bộ ghế của đơn.");
    await tx.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", confirmedAt: now } });
    await tx.notification.create({ data: { userId: booking.userId, bookingId: booking.id, type: "BOOKING_CONFIRMED", title: "Đặt vé thành công", body: `Vé ${booking.code.slice(0, 8).toUpperCase()} đã sẵn sàng. Mở ứng dụng để xem QR.` } });
    if (booking.voucherId) await tx.voucher.update({ where: { id: booking.voucherId }, data: { usedCount: { increment: 1 } } });
    return { payment, bookingStatus: "CONFIRMED" as const, idempotent: false as const };
  }, { timeout: 15_000 });
}
