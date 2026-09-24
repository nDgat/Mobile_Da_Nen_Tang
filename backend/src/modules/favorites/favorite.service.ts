import { addFavorite, findFavorite, findFavoritePage, findMovieForFavorite, removeFavorite } from "./favorite.repository.js";

export class FavoriteValidationError extends Error {}
export class FavoriteNotFoundError extends Error {}
function positiveInt(value: unknown, field: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new FavoriteValidationError(`${field} phải là số nguyên dương.`); return parsed; }

export async function listFavorites(userId: number, query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 20 : positiveInt(query.limit, "limit");
  if (limit > 50) throw new FavoriteValidationError("limit không được lớn hơn 50.");
  const { items, total } = await findFavoritePage(userId, (page - 1) * limit, limit);
  return { data: items.map(item => ({ id: item.id, createdAt: item.createdAt.toISOString(), movie: { ...item.movie, releaseDate: item.movie.releaseDate.toISOString().slice(0, 10), createdAt: item.movie.createdAt.toISOString(), updatedAt: item.movie.updatedAt.toISOString() } })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function favoriteStatus(movieIdValue: string, userId: number) { const movieId = positiveInt(movieIdValue, "ID phim"); return { isFavorite: Boolean(await findFavorite(movieId, userId)) }; }
export async function createFavorite(movieIdValue: string, userId: number) { const movieId = positiveInt(movieIdValue, "ID phim"); if (!await findMovieForFavorite(movieId)) throw new FavoriteNotFoundError("Không tìm thấy phim đang hoạt động."); const item = await addFavorite(movieId, userId); return { movieId: item.movieId, isFavorite: true as const, createdAt: item.createdAt.toISOString() }; }
export async function deleteFavorite(movieIdValue: string, userId: number) { const movieId = positiveInt(movieIdValue, "ID phim"); await removeFavorite(movieId, userId); return { movieId, isFavorite: false as const }; }
