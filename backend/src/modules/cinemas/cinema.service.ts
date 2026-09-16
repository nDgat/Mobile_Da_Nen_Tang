import type { Cinema } from "../../generated/prisma/client.js";
import {
  findCinemaById,
  findCinemaPage,
  insertCinema,
  updateCinemaById,
  type CinemaUpdateData,
  type CinemaWriteData,
} from "./cinema.repository.js";

const MAX_PAGE_SIZE = 100;

export class CinemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CinemaValidationError";
  }
}

export class CinemaNotFoundError extends Error {
  constructor(id: number) {
    super(`Không tìm thấy rạp có ID ${id}.`);
    this.name = "CinemaNotFoundError";
  }
}

export interface CinemaDto {
  id: number;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
}

function toCinemaDto(cinema: Cinema): CinemaDto {
  return {
    id: cinema.id,
    name: cinema.name,
    address: cinema.address,
    city: cinema.city,
    isActive: cinema.isActive,
  };
}

function requireObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CinemaValidationError("Body phải là một JSON object.");
  }

  return value as Record<string, unknown>;
}

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readRequiredText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CinemaValidationError(`${fieldName} phải là chuỗi không rỗng.`);
  }

  const text = value.trim();
  if (text.length > maximumLength) {
    throw new CinemaValidationError(
      `${fieldName} không được vượt quá ${maximumLength} ký tự.`,
    );
  }

  return text;
}

function readBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new CinemaValidationError("isActive phải là true hoặc false.");
  }

  return value;
}

function readPositiveInteger(
  value: unknown,
  fieldName: string,
  maximum?: number,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CinemaValidationError(`${fieldName} phải là số nguyên dương.`);
  }
  if (maximum !== undefined && parsed > maximum) {
    throw new CinemaValidationError(`${fieldName} không được lớn hơn ${maximum}.`);
  }
  return parsed;
}

export function parseCinemaId(value: string): number {
  return readPositiveInteger(value, "ID rạp");
}

function readCreateData(value: unknown): CinemaWriteData {
  const body = requireObject(value);

  return {
    name: readRequiredText(body.name, "name", 150),
    address: readRequiredText(body.address, "address", 255),
    city: readRequiredText(body.city, "city", 100),
    isActive: body.isActive === undefined ? true : readBoolean(body.isActive),
  };
}

function readUpdateData(value: unknown): CinemaUpdateData {
  const body = requireObject(value);
  const data: CinemaUpdateData = {};

  if (hasOwn(body, "name")) {
    data.name = readRequiredText(body.name, "name", 150);
  }
  if (hasOwn(body, "address")) {
    data.address = readRequiredText(body.address, "address", 255);
  }
  if (hasOwn(body, "city")) {
    data.city = readRequiredText(body.city, "city", 100);
  }
  if (hasOwn(body, "isActive")) {
    data.isActive = readBoolean(body.isActive);
  }

  if (Object.keys(data).length === 0) {
    throw new CinemaValidationError("Body không có trường rạp hợp lệ để cập nhật.");
  }

  return data;
}

export async function listCinemas(query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : readPositiveInteger(query.page, "page");
  const limit =
    query.limit === undefined
      ? 10
      : readPositiveInteger(query.limit, "limit", MAX_PAGE_SIZE);

  let isActive: boolean | undefined;
  if (query.active !== undefined) {
    if (query.active !== "true" && query.active !== "false") {
      throw new CinemaValidationError("active phải là true hoặc false.");
    }
    isActive = query.active === "true";
  }

  const city =
    query.city === undefined
      ? undefined
      : readRequiredText(query.city, "city", 100);

  const { items, total } = await findCinemaPage(
    (page - 1) * limit,
    limit,
    isActive,
    city,
  );

  return {
    data: items.map(toCinemaDto),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCinema(id: number): Promise<CinemaDto> {
  const cinema = await findCinemaById(id);
  if (!cinema) {
    throw new CinemaNotFoundError(id);
  }

  return toCinemaDto(cinema);
}

export async function createCinema(body: unknown): Promise<CinemaDto> {
  return toCinemaDto(await insertCinema(readCreateData(body)));
}

export async function updateCinema(
  id: number,
  body: unknown,
): Promise<CinemaDto> {
  await getCinema(id);
  return toCinemaDto(await updateCinemaById(id, readUpdateData(body)));
}

export async function deactivateCinema(id: number): Promise<void> {
  await getCinema(id);
  await updateCinemaById(id, { isActive: false });
}

