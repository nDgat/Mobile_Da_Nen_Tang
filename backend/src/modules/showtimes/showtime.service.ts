import type { Showtime, ShowtimeStatus } from "../../generated/prisma/client.js";
import { countActiveRoomSeats, findMovieForShowtime, findOverlappingShowtime, findRoomForShowtime, findShowtimeById, findShowtimePage, findShowtimeSeatMap, insertShowtimeWithSeats, updateShowtimeStatus } from "./showtime.repository.js";
import { cleanupExpiredHolds } from "../bookings/booking.repository.js";

export class ShowtimeValidationError extends Error {}
export class ShowtimeNotFoundError extends Error { constructor(id: number) { super(`Không tìm thấy suất chiếu có ID ${id}.`); } }
export class ShowtimeConflictError extends Error {}

const toDto = (item: Showtime) => ({ id: item.id, movieId: item.movieId, roomId: item.roomId, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(), status: item.status });
function positiveInt(value: unknown, field: string, max?: number) { const number = typeof value === "number" ? value : Number(value); if (!Number.isInteger(number) || number <= 0) throw new ShowtimeValidationError(`${field} phải là số nguyên dương.`); if (max !== undefined && number > max) throw new ShowtimeValidationError(`${field} không được lớn hơn ${max}.`); return number; }
function objectBody(value: unknown): Record<string, unknown> { if (typeof value !== "object" || value === null || Array.isArray(value)) throw new ShowtimeValidationError("Body phải là một JSON object."); return value as Record<string, unknown>; }
function dateTime(value: unknown, field: string) { if (typeof value !== "string" || value.trim() === "") throw new ShowtimeValidationError(`${field} phải là thời gian ISO 8601.`); const result = new Date(value); if (Number.isNaN(result.getTime())) throw new ShowtimeValidationError(`${field} không hợp lệ.`); return result; }
function status(value: unknown): ShowtimeStatus { if (value !== "SCHEDULED" && value !== "CANCELLED" && value !== "FINISHED") throw new ShowtimeValidationError("status phải là SCHEDULED, CANCELLED hoặc FINISHED."); return value; }
function price(value: unknown, field: string) { const number = typeof value === "number" ? value : Number(value); if (!Number.isSafeInteger(number) || number <= 0) throw new ShowtimeValidationError(`${field} phải là số nguyên dương.`); return BigInt(number); }
export const parseShowtimeId = (value: string) => positiveInt(value, "ID suất chiếu");

export async function listShowtimes(query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 20 : positiveInt(query.limit, "limit", 100);
  const filters = {
    ...(query.movieId === undefined ? {} : { movieId: positiveInt(query.movieId, "movieId") }),
    ...(query.roomId === undefined ? {} : { roomId: positiveInt(query.roomId, "roomId") }),
    ...(query.status === undefined ? {} : { status: status(query.status) }),
    ...(query.from === undefined ? {} : { from: dateTime(query.from, "from") }),
    ...(query.to === undefined ? {} : { to: dateTime(query.to, "to") }),
  };
  const { items, total } = await findShowtimePage((page - 1) * limit, limit, filters);
  return { data: items.map(toDto), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getShowtime(id: number) { const item = await findShowtimeById(id); if (!item) throw new ShowtimeNotFoundError(id); return toDto(item); }

export async function createShowtime(value: unknown) {
  const body = objectBody(value);
  const movieId = positiveInt(body.movieId, "movieId");
  const roomId = positiveInt(body.roomId, "roomId");
  const startsAt = dateTime(body.startsAt, "startsAt");
  const standardPrice = price(body.standardPrice, "standardPrice");
  const vipPrice = price(body.vipPrice, "vipPrice");
  if (vipPrice < standardPrice) throw new ShowtimeValidationError("vipPrice không được thấp hơn standardPrice.");
  const [movie, room, seatCount] = await Promise.all([findMovieForShowtime(movieId), findRoomForShowtime(roomId), countActiveRoomSeats(roomId)]);
  if (!movie || !movie.isActive) throw new ShowtimeValidationError(`Phim ${movieId} không tồn tại hoặc đã ngừng hoạt động.`);
  if (!room || !room.isActive) throw new ShowtimeValidationError(`Phòng ${roomId} không tồn tại hoặc đã ngừng hoạt động.`);
  if (seatCount === 0) throw new ShowtimeValidationError("Phòng chưa có ghế hoạt động.");
  const endsAt = new Date(startsAt.getTime() + movie.durationMinutes * 60_000);
  if (await findOverlappingShowtime(roomId, startsAt, endsAt)) throw new ShowtimeConflictError("Thời gian suất chiếu bị trùng lịch của phòng.");
  return { data: toDto(await insertShowtimeWithSeats({ movieId, roomId, startsAt, endsAt }, standardPrice, vipPrice)), seatCount };
}

export async function changeShowtimeStatus(id: number, value: unknown) {
  await getShowtime(id);
  const body = objectBody(value);
  return toDto(await updateShowtimeStatus(id, status(body.status)));
}

export async function getShowtimeSeatMap(id: number) {
  await cleanupExpiredHolds();
  const showtime = await findShowtimeSeatMap(id);
  if (!showtime) throw new ShowtimeNotFoundError(id);
  return {
    showtime: { id: showtime.id, startsAt: showtime.startsAt.toISOString(), endsAt: showtime.endsAt.toISOString(), status: showtime.status },
    movie: showtime.movie,
    room: { id: showtime.room.id, name: showtime.room.name },
    cinema: showtime.room.cinema,
    seats: showtime.seats.map(item => ({
      id: item.id, seatId: item.seatId, rowLabel: item.seat.rowLabel, seatNumber: item.seat.seatNumber,
      type: item.seat.type, price: item.price.toString(), status: item.status,
    })).sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || a.seatNumber - b.seatNumber),
  };
}
