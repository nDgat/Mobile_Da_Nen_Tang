import { prisma } from "../../database/prisma.js";

export interface RoomWriteData {
  cinemaId: number;
  name: string;
  isActive: boolean;
}

export type RoomUpdateData = Partial<RoomWriteData>;

export async function findRoomPage(
  skip: number,
  take: number,
  cinemaId?: number,
  isActive?: boolean,
) {
  const where = {
    ...(cinemaId === undefined ? {} : { cinemaId }),
    ...(isActive === undefined ? {} : { isActive }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.room.findMany({ where, orderBy: [{ cinemaId: "asc" }, { name: "asc" }], skip, take }),
    prisma.room.count({ where }),
  ]);
  return { items, total };
}

export const findRoomById = (id: number) => prisma.room.findUnique({ where: { id } });
export const findCinemaForRoom = (id: number) => prisma.cinema.findUnique({ where: { id } });
export const findRoomByIdentity = (cinemaId: number, name: string) =>
  prisma.room.findUnique({ where: { cinemaId_name: { cinemaId, name } } });
export const insertRoom = (data: RoomWriteData) => prisma.room.create({ data });
export const updateRoomById = (id: number, data: RoomUpdateData) =>
  prisma.room.update({ where: { id }, data });

