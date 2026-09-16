import type { Prisma, ShowtimeStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";

export interface ShowtimeFilters { movieId?: number; roomId?: number; status?: ShowtimeStatus; from?: Date; to?: Date; }

export async function findShowtimePage(skip: number, take: number, filters: ShowtimeFilters) {
  const where = {
    ...(filters.movieId === undefined ? {} : { movieId: filters.movieId }),
    ...(filters.roomId === undefined ? {} : { roomId: filters.roomId }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.from === undefined && filters.to === undefined ? {} : { startsAt: { ...(filters.from === undefined ? {} : { gte: filters.from }), ...(filters.to === undefined ? {} : { lte: filters.to }) } }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.showtime.findMany({ where, orderBy: [{ startsAt: "asc" }, { id: "asc" }], skip, take }),
    prisma.showtime.count({ where }),
  ]);
  return { items, total };
}

export const findShowtimeById = (id: number) => prisma.showtime.findUnique({ where: { id } });
export const findMovieForShowtime = (id: number) => prisma.movie.findUnique({ where: { id } });
export const findRoomForShowtime = (id: number) => prisma.room.findUnique({ where: { id } });
export const countActiveRoomSeats = (roomId: number) => prisma.seat.count({ where: { roomId, isActive: true } });
export const findOverlappingShowtime = (roomId: number, startsAt: Date, endsAt: Date) => prisma.showtime.findFirst({ where: { roomId, status: { not: "CANCELLED" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });

export async function insertShowtimeWithSeats(data: { movieId: number; roomId: number; startsAt: Date; endsAt: Date }, standardPrice: bigint, vipPrice: bigint) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const showtime = await tx.showtime.create({ data });
    const seats = await tx.seat.findMany({ where: { roomId: data.roomId, isActive: true }, select: { id: true, type: true } });
    await tx.showtimeSeat.createMany({ data: seats.map(seat => ({ showtimeId: showtime.id, seatId: seat.id, price: seat.type === "VIP" ? vipPrice.toString() : standardPrice.toString() })) });
    return showtime;
  });
}

export const updateShowtimeStatus = (id: number, status: ShowtimeStatus) => prisma.showtime.update({ where: { id }, data: { status } });

