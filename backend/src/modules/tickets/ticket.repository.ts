import { prisma } from "../../database/prisma.js";

const ticketInclude = {
  user: { select: { fullName: true, email: true } },
  showtime: { include: { movie: { select: { id: true, title: true } }, room: { select: { id: true, name: true, cinema: { select: { id: true, name: true, address: true, city: true } } } } } },
  seats: { orderBy: { seatLabel: "asc" as const } },
  concessions: { orderBy: { id: "asc" as const } },
  payments: { where: { status: "SUCCEEDED" as const }, orderBy: { createdAt: "desc" as const }, take: 1 },
};

export const findConfirmedTicketForUser = (bookingId: number, userId: number) => prisma.booking.findFirst({ where: { id: bookingId, userId, status: "CONFIRMED" }, include: ticketInclude });
export const findConfirmedTicket = (bookingId: number, bookingCode: string) => prisma.booking.findFirst({ where: { id: bookingId, code: bookingCode, status: "CONFIRMED" }, include: ticketInclude });
