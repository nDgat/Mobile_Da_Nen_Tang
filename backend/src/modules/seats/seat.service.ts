import type { Seat, SeatType } from "../../generated/prisma/client.js";
import { findRoomForSeat, findSeatById, findSeatByIdentity, findSeatPage, insertSeat, updateSeatById, type SeatUpdateData } from "./seat.repository.js";

export class SeatValidationError extends Error {}
export class SeatNotFoundError extends Error { constructor(id: number) { super(`Không tìm thấy ghế có ID ${id}.`); } }
export class SeatConflictError extends Error {}

const toDto = (seat: Seat) => ({ id: seat.id, roomId: seat.roomId, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber, type: seat.type, isActive: seat.isActive });
const owns = (body: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(body, key);
function bodyObject(value: unknown): Record<string, unknown> { if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SeatValidationError("Body phải là một JSON object."); return value as Record<string, unknown>; }
function positiveInt(value: unknown, field: string, max?: number): number { const parsed = typeof value === "number" ? value : Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new SeatValidationError(`${field} phải là số nguyên dương.`); if (max !== undefined && parsed > max) throw new SeatValidationError(`${field} không được lớn hơn ${max}.`); return parsed; }
function row(value: unknown): string { if (typeof value !== "string" || !/^[A-Za-z0-9]{1,5}$/.test(value.trim())) throw new SeatValidationError("rowLabel phải gồm 1-5 chữ hoặc số."); return value.trim().toUpperCase(); }
function seatType(value: unknown): SeatType { if (value !== "STANDARD" && value !== "VIP") throw new SeatValidationError("type phải là STANDARD hoặc VIP."); return value; }
function bool(value: unknown): boolean { if (typeof value !== "boolean") throw new SeatValidationError("isActive phải là true hoặc false."); return value; }
export const parseSeatId = (value: string) => positiveInt(value, "ID ghế");

async function ensureRoom(id: number) { if (!await findRoomForSeat(id)) throw new SeatValidationError(`Không tìm thấy phòng có ID ${id}.`); }
async function ensureUnique(roomId: number, rowLabel: string, seatNumber: number, currentId?: number) { const duplicate = await findSeatByIdentity(roomId, rowLabel, seatNumber); if (duplicate && duplicate.id !== currentId) throw new SeatConflictError("Vị trí ghế đã tồn tại trong phòng này."); }

export async function listSeats(query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 20 : positiveInt(query.limit, "limit", 100);
  const roomId = query.roomId === undefined ? undefined : positiveInt(query.roomId, "roomId");
  const type = query.type === undefined ? undefined : seatType(query.type);
  let active: boolean | undefined;
  if (query.active !== undefined) { if (query.active !== "true" && query.active !== "false") throw new SeatValidationError("active phải là true hoặc false."); active = query.active === "true"; }
  const { items, total } = await findSeatPage((page - 1) * limit, limit, roomId, type, active);
  return { data: items.map(toDto), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function getSeat(id: number) { const seat = await findSeatById(id); if (!seat) throw new SeatNotFoundError(id); return toDto(seat); }
export async function createSeat(value: unknown) { const body = bodyObject(value); const roomId = positiveInt(body.roomId, "roomId"); const rowLabel = row(body.rowLabel); const seatNumber = positiveInt(body.seatNumber, "seatNumber", 999); const type = body.type === undefined ? "STANDARD" : seatType(body.type); await ensureRoom(roomId); await ensureUnique(roomId, rowLabel, seatNumber); return toDto(await insertSeat({ roomId, rowLabel, seatNumber, type, isActive: body.isActive === undefined ? true : bool(body.isActive) })); }
export async function updateSeat(id: number, value: unknown) { const current = await findSeatById(id); if (!current) throw new SeatNotFoundError(id); const body = bodyObject(value); const data: SeatUpdateData = {}; if (owns(body, "roomId")) data.roomId = positiveInt(body.roomId, "roomId"); if (owns(body, "rowLabel")) data.rowLabel = row(body.rowLabel); if (owns(body, "seatNumber")) data.seatNumber = positiveInt(body.seatNumber, "seatNumber", 999); if (owns(body, "type")) data.type = seatType(body.type); if (owns(body, "isActive")) data.isActive = bool(body.isActive); if (Object.keys(data).length === 0) throw new SeatValidationError("Body không có trường ghế hợp lệ để cập nhật."); const roomId = data.roomId ?? current.roomId; const rowLabel = data.rowLabel ?? current.rowLabel; const seatNumber = data.seatNumber ?? current.seatNumber; await ensureRoom(roomId); await ensureUnique(roomId, rowLabel, seatNumber, id); return toDto(await updateSeatById(id, data)); }
export async function deactivateSeat(id: number) { await getSeat(id); await updateSeatById(id, { isActive: false }); }

