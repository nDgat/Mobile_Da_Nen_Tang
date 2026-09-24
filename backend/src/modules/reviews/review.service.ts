import { findMovie, findReviewByUser, findReviewPage, hasConfirmedMovieBooking, removeReview, saveReview } from "./review.repository.js";

export class ReviewValidationError extends Error {}
export class ReviewNotFoundError extends Error {}
export class ReviewForbiddenError extends Error {}

function positiveInt(value: unknown, field: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new ReviewValidationError(`${field} phải là số nguyên dương.`); return parsed; }
function reviewDto(item: { id: number; rating: number; comment: string | null; createdAt: Date; updatedAt: Date; user?: { fullName: string } }) { return { id: item.id, rating: item.rating, comment: item.comment, reviewerName: item.user?.fullName, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }; }

export async function listReviews(movieIdValue: string, query: Record<string, unknown>) {
  const movieId = positiveInt(movieIdValue, "ID phim");
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 10 : positiveInt(query.limit, "limit");
  if (limit > 50) throw new ReviewValidationError("limit không được lớn hơn 50.");
  if (!await findMovie(movieId)) throw new ReviewNotFoundError("Không tìm thấy phim.");
  const { items, total, averageRating } = await findReviewPage(movieId, (page - 1) * limit, limit);
  return { data: items.map(reviewDto), meta: { page, limit, total, totalPages: Math.ceil(total / limit), averageRating: Number(averageRating.toFixed(1)) } };
}

export async function getMyReview(movieIdValue: string, userId: number) {
  const review = await findReviewByUser(positiveInt(movieIdValue, "ID phim"), userId);
  return review ? reviewDto(review) : null;
}

export async function upsertMyReview(movieIdValue: string, userId: number, body: unknown) {
  const movieId = positiveInt(movieIdValue, "ID phim");
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new ReviewValidationError("Body phải là JSON object.");
  const data = body as Record<string, unknown>;
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ReviewValidationError("rating phải là số nguyên từ 1 đến 5.");
  if (data.comment !== undefined && data.comment !== null && typeof data.comment !== "string") throw new ReviewValidationError("comment phải là chuỗi.");
  const comment = typeof data.comment === "string" ? data.comment.trim() : "";
  if (comment.length > 1000) throw new ReviewValidationError("comment không được vượt quá 1000 ký tự.");
  if (!await findMovie(movieId)) throw new ReviewNotFoundError("Không tìm thấy phim.");
  if (!await hasConfirmedMovieBooking(movieId, userId)) throw new ReviewForbiddenError("Bạn chỉ có thể đánh giá phim đã mua vé.");
  return reviewDto(await saveReview(movieId, userId, rating, comment || null));
}

export async function deleteMyReview(movieIdValue: string, userId: number) {
  if ((await removeReview(positiveInt(movieIdValue, "ID phim"), userId)).count === 0) throw new ReviewNotFoundError("Bạn chưa đánh giá phim này.");
}
