import type { Room } from "../../generated/prisma/client.js";
import {
  findCinemaForRoom,
  findRoomById,
  findRoomByIdentity,
  findRoomPage,
  insertRoom,
  updateRoomById,
  type RoomUpdateData,
} from "./room.repository.js";

export class RoomValidationError extends Error {}
export class RoomNotFoundError extends Error {
  constructor(id: number) { super(`Không tìm thấy phòng có ID ${id}.`); }
}
export class RoomConflictError extends Error {}

const toDto = (room: Room) => ({
  id: room.id,
  cinemaId: room.cinemaId,
  name: room.name,
  isActive: room.isActive,
});

function objectBody(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RoomValidationError("Body phải là một JSON object.");
  }
  return value as Record<string, unknown>;
}

function positiveInt(value: unknown, field: string, max?: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new RoomValidationError(`${field} phải là số nguyên dương.`);
  if (max !== undefined && parsed > max) throw new RoomValidationError(`${field} không được lớn hơn ${max}.`);
  return parsed;
}

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim() === "") throw new RoomValidationError(`${field} phải là chuỗi không rỗng.`);
  const result = value.trim();
  if (result.length > max) throw new RoomValidationError(`${field} không được vượt quá ${max} ký tự.`);
  return result;
}

function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new RoomValidationError("isActive phải là true hoặc false.");
  return value;
}

const owns = (body: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(body, key);
export const parseRoomId = (value: string) => positiveInt(value, "ID phòng");

async function ensureCinema(id: number): Promise<void> {
  const cinema = await findCinemaForRoom(id);
  if (!cinema) throw new RoomValidationError(`Không tìm thấy rạp có ID ${id}.`);
}

async function ensureUnique(cinemaId: number, name: string, currentId?: number): Promise<void> {
  const duplicate = await findRoomByIdentity(cinemaId, name);
  if (duplicate && duplicate.id !== currentId) throw new RoomConflictError("Tên phòng đã tồn tại trong rạp này.");
}

export async function listRooms(query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : positiveInt(query.page, "page");
  const limit = query.limit === undefined ? 10 : positiveInt(query.limit, "limit", 100);
  const cinemaId = query.cinemaId === undefined ? undefined : positiveInt(query.cinemaId, "cinemaId");
  let active: boolean | undefined;
  if (query.active !== undefined) {
    if (query.active !== "true" && query.active !== "false") throw new RoomValidationError("active phải là true hoặc false.");
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
  await ensureCinema(cinemaId);
  await ensureUnique(cinemaId, name);
  return toDto(await insertRoom({ cinemaId, name, isActive: body.isActive === undefined ? true : bool(body.isActive) }));
}

export async function updateRoom(id: number, value: unknown) {
  const current = await findRoomById(id);
  if (!current) throw new RoomNotFoundError(id);
  const body = objectBody(value);
  const data: RoomUpdateData = {};
  if (owns(body, "cinemaId")) data.cinemaId = positiveInt(body.cinemaId, "cinemaId");
  if (owns(body, "name")) data.name = text(body.name, "name", 100);
  if (owns(body, "isActive")) data.isActive = bool(body.isActive);
  if (Object.keys(data).length === 0) throw new RoomValidationError("Body không có trường phòng hợp lệ để cập nhật.");
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

