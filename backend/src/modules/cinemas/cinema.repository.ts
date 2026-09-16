import { prisma } from "../../database/prisma.js";

export interface CinemaWriteData {
  name: string;
  address: string;
  city: string;
  isActive: boolean;
}

export type CinemaUpdateData = Partial<CinemaWriteData>;

export async function findCinemaPage(
  skip: number,
  take: number,
  isActive?: boolean,
  city?: string,
) {
  const where = {
    ...(isActive === undefined ? {} : { isActive }),
    ...(city === undefined ? {} : { city: { contains: city } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.cinema.findMany({
      where,
      orderBy: [{ city: "asc" }, { name: "asc" }, { id: "asc" }],
      skip,
      take,
    }),
    prisma.cinema.count({ where }),
  ]);

  return { items, total };
}

export function findCinemaById(id: number) {
  return prisma.cinema.findUnique({ where: { id } });
}

export function insertCinema(data: CinemaWriteData) {
  return prisma.cinema.create({ data });
}

export function updateCinemaById(id: number, data: CinemaUpdateData) {
  return prisma.cinema.update({
    where: { id },
    data,
  });
}

