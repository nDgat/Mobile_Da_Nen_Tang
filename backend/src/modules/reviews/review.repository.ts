import { prisma } from "../../database/prisma.js";

export async function findReviewPage(movieId: number, skip: number, take: number) {
  const where = { movieId, isVisible: true };
  const [items, aggregate] = await prisma.$transaction([
    prisma.movieReview.findMany({ where, include: { user: { select: { fullName: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip, take }),
    prisma.movieReview.aggregate({ where, _count: { _all: true }, _avg: { rating: true } }),
  ]);
  return { items, total: aggregate._count._all, averageRating: aggregate._avg.rating ?? 0 };
}

export const findReviewByUser = (movieId: number, userId: number) => prisma.movieReview.findUnique({ where: { userId_movieId: { userId, movieId } } });
export const findMovie = (movieId: number) => prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
export const hasConfirmedMovieBooking = (movieId: number, userId: number) => prisma.booking.findFirst({ where: { userId, status: "CONFIRMED", showtime: { movieId } }, select: { id: true } });
export const saveReview = (movieId: number, userId: number, rating: number, comment: string | null) => prisma.movieReview.upsert({ where: { userId_movieId: { userId, movieId } }, create: { movieId, userId, rating, comment }, update: { rating, comment, isVisible: true } });
export const removeReview = (movieId: number, userId: number) => prisma.movieReview.deleteMany({ where: { movieId, userId } });
