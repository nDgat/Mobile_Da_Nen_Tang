import { prisma } from "../../database/prisma.js";

export const findMovieForFavorite = (movieId: number) => prisma.movie.findFirst({ where: { id: movieId, isActive: true }, select: { id: true } });
export const findFavorite = (movieId: number, userId: number) => prisma.movieFavorite.findUnique({ where: { userId_movieId: { userId, movieId } } });
export const addFavorite = (movieId: number, userId: number) => prisma.movieFavorite.upsert({ where: { userId_movieId: { userId, movieId } }, create: { movieId, userId }, update: {} });
export const removeFavorite = (movieId: number, userId: number) => prisma.movieFavorite.deleteMany({ where: { movieId, userId } });

export async function findFavoritePage(userId: number, skip: number, take: number) {
  const where = { userId, movie: { isActive: true } };
  const [items, total] = await prisma.$transaction([
    prisma.movieFavorite.findMany({ where, include: { movie: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take }),
    prisma.movieFavorite.count({ where }),
  ]);
  return { items, total };
}
