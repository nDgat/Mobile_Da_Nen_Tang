import { findConfirmedTicket, findConfirmedTicketForUser } from "./ticket.repository.js";
import { createTicketToken, verifyTicketToken } from "./ticket.token.js";

export class TicketValidationError extends Error {}
export class TicketNotFoundError extends Error {}

function positiveInt(value: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new TicketValidationError("ID booking phải là số nguyên dương."); return parsed; }

function ticketDto(booking: NonNullable<Awaited<ReturnType<typeof findConfirmedTicketForUser>>>) {
  const token = createTicketToken(booking.id, booking.code);
  return {
    bookingId: booking.id, bookingCode: booking.code, qrValue: `CINEBOOK:${token}`,
    holder: booking.user,
    movie: booking.showtime.movie, cinema: booking.showtime.room.cinema,
    room: { id: booking.showtime.room.id, name: booking.showtime.room.name },
    showtime: { id: booking.showtime.id, startsAt: booking.showtime.startsAt.toISOString(), endsAt: booking.showtime.endsAt.toISOString() },
    seats: booking.seats.map(item => item.seatLabel), totalAmount: booking.totalAmount.toString(),
    concessions: booking.concessions.map(item => ({ name: item.productName, quantity: item.quantity })),
    voucherCode: booking.voucherCode,
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    paymentCode: booking.payments[0]?.code ?? null,
  };
}

export async function getTicket(bookingIdValue: string, userId: number) {
  const booking = await findConfirmedTicketForUser(positiveInt(bookingIdValue), userId);
  if (!booking) throw new TicketNotFoundError("Không tìm thấy vé đã thanh toán.");
  return ticketDto(booking);
}

export async function verifyTicket(body: unknown) {
  if (typeof body !== "object" || body === null || Array.isArray(body) || typeof (body as Record<string, unknown>).qrValue !== "string") throw new TicketValidationError("qrValue là bắt buộc.");
  let payload;
  try { payload = verifyTicketToken((body as { qrValue: string }).qrValue.trim()); }
  catch (error) { throw new TicketValidationError(error instanceof Error ? error.message : "QR không hợp lệ."); }
  const booking = await findConfirmedTicket(payload.bookingId, payload.bookingCode);
  if (!booking) throw new TicketNotFoundError("Vé không tồn tại hoặc không còn hiệu lực.");
  return { valid: true as const, ticket: ticketDto(booking) };
}
