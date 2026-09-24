import { processMockPayment, type MockPaymentOutcome } from "./payment.repository.js";

export class PaymentValidationError extends Error {}
export class PaymentNotFoundError extends Error {}
export class PaymentConflictError extends Error {}

function positiveInt(value: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new PaymentValidationError("ID booking phải là số nguyên dương."); return parsed; }
function outcome(body: unknown): MockPaymentOutcome {
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new PaymentValidationError("Body phải là JSON object.");
  const value = (body as Record<string, unknown>).outcome;
  if (value !== "SUCCESS" && value !== "FAILURE" && value !== "CANCEL") throw new PaymentValidationError("outcome phải là SUCCESS, FAILURE hoặc CANCEL.");
  return value;
}

export async function payMock(bookingIdValue: string, userId: number, body: unknown) {
  const result = await processMockPayment(positiveInt(bookingIdValue), userId, outcome(body));
  if ("error" in result) {
    if (result.error === "BOOKING_NOT_FOUND") throw new PaymentNotFoundError("Không tìm thấy đơn đặt vé.");
    if (result.error === "BOOKING_EXPIRED") throw new PaymentConflictError("Đơn đã hết hạn.");
    if (result.error === "SEATS_NOT_HELD") throw new PaymentConflictError("Ghế của đơn không còn được giữ đầy đủ.");
    if (result.error === "VOUCHER_INVALID") throw new PaymentConflictError("Voucher không còn hợp lệ tại thời điểm thanh toán.");
    throw new PaymentConflictError("Đơn không ở trạng thái có thể thanh toán.");
  }
  return {
    payment: { id: result.payment.id, code: result.payment.code, provider: result.payment.provider, amount: result.payment.amount.toString(), status: result.payment.status, failureReason: result.payment.failureReason, completedAt: result.payment.completedAt.toISOString() },
    bookingStatus: result.bookingStatus, idempotent: result.idempotent,
  };
}
