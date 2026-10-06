import { prisma } from "../../database/prisma.js";
import { Prisma, type MovieCategory } from "../../generated/prisma/client.js";

export interface MovieWriteData {
  category: MovieCategory;
  categories?: MovieCategory[];
  title: string;
  synopsis: string | null;
  durationMinutes: number;
  releaseDate: Date;
  posterUrl: string | null;
  isActive: boolean;
}

export type MovieUpdateData = Partial<MovieWriteData>;

export async function findMoviePage(
  skip: number,
  take: number,
  isActive?: boolean,
  category?: MovieCategory,
) {
  const where = { ...(isActive === undefined ? {} : { isActive }), ...(category ? { OR: [{ categories: { array_contains: [category] } }, { categories: { equals: Prisma.DbNull }, category }] } : {}) };

  const [items, total] = await prisma.$transaction([
    prisma.movie.findMany({
      where,
      orderBy: [{ releaseDate: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    prisma.movie.count({ where }),
  ]);

  return { items, total };
}

export function findMovieById(id: number) {
  return prisma.movie.findUnique({ where: { id } });
}

export function insertMovie(data: MovieWriteData) {
  return prisma.movie.create({ data });
}

export function updateMovieById(id: number, data: MovieUpdateData) {
  return prisma.movie.update({
    where: { id },
    data,
  });
}

