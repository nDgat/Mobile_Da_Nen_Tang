import type { Room, SeatType } from "../../generated/prisma/client.js";
import {
  findCinemaForRoom,
  findRoomById,
  findRoomByIdentity,
  findRoomPage,
  insertRoomWithSeats,
  updateRoomById,
  type RoomSeatInput,
  type RoomUpdateData,
} from "./room.repository.js";

export class RoomValidationError extends Error {}
export class RoomNotFoundError extends Error {
  constructor(id: number) { super(`Kh\u00f4ng t\u00ecm th\u1ea5y ph\u00f2ng c\u00f3 ID ${id}.`); }
}
export class RoomConflictError extends Error {}

const toDto = (room: Room) => ({ id: room.id, cinemaId: room.cinemaId, name: room.name, isActive: room.isActive });

function objectBody(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new RoomValidationError("Body ph\u1ea3i l\u00e0 m\u1ed9t JSON object.");
  return value as Record<string, unknown>;
}
function positiveInt(value: unknown, field: string, max?: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new RoomValidationError(`${field} ph\u1ea3i l\u00e0 s\u1ed1 nguy\u00ean d\u01b0\u01a1ng.`);
  if (max !== undefined && parsed > max) throw new RoomValidationError(`${field} kh\u00f4ng \u0111\u01b0\u1ee3c l\u1edbn h\u01a1n ${max}.`);
  return parsed;
}
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim() === "") throw new RoomValidationError(`${field} ph\u1ea3i l\u00e0 chu\u1ed7i kh\u00f4ng r\u1ed7ng.`);
  const result = value.trim();
  if (result.length > max) throw new RoomValidationError(`${field} kh\u00f4ng \u0111\u01b0\u1ee3c v\u01b0\u1ee3t qu\u00e1 ${max} k\u00fd t\u1ef1.`);
  return result;
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new RoomValidationError("isActive ph\u1ea3i l\u00e0 true ho\u1eb7c false.");
  return value;
}

function parseSeatLayout(value: unknown): RoomSeatInput[] {
  if (!Array.isArray(value)) throw new RoomValidationError("seatLayout ph\u1ea3i l\u00e0 danh s\u00e1ch gh\u1ebf.");
  if (value.length < 4 || value.length > 500) throw new RoomValidationError("S\u01a1 \u0111\u1ed3 ph\u1ea3i c\u00f3 t\u1eeb 4 \u0111\u1ebfn 500 v\u1ecb tr\u00ed gh\u1ebf.");
  const seen = new Set<string>();
  const seats = value.map((raw, index): RoomSeatInput => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new RoomValidationError(`Gh\u1ebf th\u1ee9 ${index + 1} kh\u00f4ng h\u1ee3p l\u1ec7.`);
    const seat = raw as Record<string, unknown>;
    const rowLabel = text(seat.rowLabel, "rowLabel", 5).toUpperCase();
    if (!/^[A-Z0-9]{1,5}$/.test(rowLabel)) throw new RoomValidationError("T\u00ean h\u00e0ng gh\u1ebf ch\u1ec9 g\u1ed3m ch\u1eef v\u00e0 s\u1ed1.");
    const seatNumber = positiveInt(seat.seatNumber, "seatNumber", 99);
    const type = seat.type;
    if (type !== "STANDARD" && type !== "VIP" && type !== "SWEETBOX") throw new RoomValidationError("Lo\u1ea1i gh\u1ebf ph\u1ea3i l\u00e0 STANDARD, VIP ho\u1eb7c SWEETBOX.");
    const key = `${rowLabel}:${seatNumber}`;
    if (seen.has(key)) throw new RoomValidationError(`Gh\u1ebf ${rowLabel}${seatNumber} b\u1ecb tr\u00f9ng.`);
    seen.add(key);
    return { rowLabel, seatNumber, type: type as SeatType };
  });
  const rows = [...new Set(seats.map(seat => seat.rowLabel))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (rows.length > 26) throw new RoomValidationError("Ph\u00f2ng kh\u00f4ng \u0111\u01b0\u1ee3c v\u01b0\u1ee3t qu\u00e1 26 h\u00e0ng.");
  const finalRow = rows.at(-1);
  if (!seats.some(seat => seat.rowLabel === finalRow && seat.type === "SWEETBOX")) throw new RoomValidationError("H\u00e0ng cu\u1ed1i ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t m\u1ed9t gh\u1ebf Sweetbox cho 2 ng\u01b0\u1eddi.");
  if (seats.some(seat => seat.rowLabel !== finalRow && seat.type === "SWEETBOX")) throw new RoomValidationError("Gh\u1ebf Sweetbox ch\u1ec9 \u0111\u01b0\u1ee3c \u0111\u1eb7t \u1edf h\u00e0ng cu\u1ed1i.");
  return seats.sort((a, b) => a.rowLabel.localeCompare(b.rowLabel, undefined, { numeric: true }) || a.seatNumber - b.seatNumber);
}

const owns = (body: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(body, key);
export const parseRoomId = (value: string) => positiveInt(value, "ID ph\u00f2ng");
async function ensureCinema(id: number): Promise<void> {
  const cinema = await findCinemaForRoom(id);
  if (!cinema) throw new RoomValidationError(`Kh\u00f4ng t\u00ecm th\u1ea5y r\u1ea1p c\u00f3 ID ${id}.`);
}
async function ensureUnique(cinemaId: number, name: string, currentId?: number): Promise<void> {
  const duplicate = await findRoomByIdentity(cinemaId, name);
  if (duplicate && duplicate.id !== currentId) throw new RoomConflictError("T\u00ean ph\u00f2ng \u0111\u00e3 t\u1ed3n t\u1ea1i trong r\u1ea1p n\u00e0y.");
}

export async function listRooms(query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 10 : positiveInt(query.limit, "limit", 100);
  const cinemaId = query.cinemaId === undefined ? undefined : positiveInt(query.cinemaId, "cinemaId");
  let active: boolean | undefined;
  if (query.active !== undefined) {
    if (query.active !== "true" && query.active !== "false") throw new RoomValidationError("active ph\u1ea3i l\u00e0 true ho\u1eb7c false.");
    active = query.active === "true";
  }
  const { items, total } = await findRoomPage((page - 1) * limit, limit, cinemaId, active);
  return { data: items.map(toDto), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function getRoom(id: number) {
  const room = await findRoomById(id);
  if (!room) throw new RoomNotFoundError(id);
  return toDto(room);
}
export async function createRoom(value: unknown) {
  const body = objectBody(value);
  const cinemaId = positiveInt(body.cinemaId, "cinemaId");
  const name = text(body.name, "name", 100);
  const seatLayout = parseSeatLayout(body.seatLayout);
  await ensureCinema(cinemaId);
  await ensureUnique(cinemaId, name);
  return toDto(await insertRoomWithSeats({ cinemaId, name, isActive: body.isActive === undefined ? true : bool(body.isActive) }, seatLayout));
}
export async function updateRoom(id: number, value: unknown) {
  const current = await findRoomById(id);
  if (!current) throw new RoomNotFoundError(id);
  const body = objectBody(value);
  const data: RoomUpdateData = {};
  if (owns(body, "cinemaId")) data.cinemaId = positiveInt(body.cinemaId, "cinemaId");
  if (owns(body, "name")) data.name = text(body.name, "name", 100);
  if (owns(body, "isActive")) data.isActive = bool(body.isActive);
  if (Object.keys(data).length === 0) throw new RoomValidationError("Body kh\u00f4ng c\u00f3 tr\u01b0\u1eddng ph\u00f2ng h\u1ee3p l\u1ec7 \u0111\u1ec3 c\u1eadp nh\u1eadt.");
  const cinemaId = data.cinemaId ?? current.cinemaId;
  const name = data.name ?? current.name;
  await ensureCinema(cinemaId);
  await ensureUnique(cinemaId, name, id);
  return toDto(await updateRoomById(id, data));
}
export async function deactivateRoom(id: number): Promise<void> {
  await getRoom(id);
  await updateRoomById(id, { isActive: false });
}
