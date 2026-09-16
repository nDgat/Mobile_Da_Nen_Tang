import type { SeatType } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";

export interface SeatWriteData { roomId: number; rowLabel: string; seatNumber: number; type: SeatType; isActive: boolean; }
export type SeatUpdateData = Partial<SeatWriteData>;

export async function findSeatPage(skip: number, take: number, roomId?: number, type?: SeatType, isActive?: boolean) {
  const where = { ...(roomId === undefined ? {} : { roomId }), ...(type === undefined ? {} : { type }), ...(isActive === undefined ? {} : { isActive }) };
  const [items, total] = await prisma.$transaction([
    prisma.seat.findMany({ where, orderBy: [{ roomId: "asc" }, { rowLabel: "asc" }, { seatNumber: "asc" }], skip, take }),
    prisma.seat.count({ where }),
  ]);
  return { items, total };
}
export const findSeatById = (id: number) => prisma.seat.findUnique({ where: { id } });
export const findRoomForSeat = (id: number) => prisma.room.findUnique({ where: { id } });
export const findSeatByIdentity = (roomId: number, rowLabel: string, seatNumber: number) => prisma.seat.findUnique({ where: { roomId_rowLabel_seatNumber: { roomId, rowLabel, seatNumber } } });
export const insertSeat = (data: SeatWriteData) => prisma.seat.create({ data });
export const updateSeatById = (id: number, data: SeatUpdateData) => prisma.seat.update({ where: { id }, data });

