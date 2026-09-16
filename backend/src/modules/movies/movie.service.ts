import type { Movie } from "../../generated/prisma/client.js";
import {
  findMovieById,
  findMoviePage,
  insertMovie,
  updateMovieById,
  type MovieUpdateData,
  type MovieWriteData,
} from "./movie.repository.js";

const MAX_PAGE_SIZE = 100;

export class MovieValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MovieValidationError";
  }
}

export class MovieNotFoundError extends Error {
  constructor(id: number) {
    super(`Không tìm thấy phim có ID ${id}.`);
    this.name = "MovieNotFoundError";
  }
}

export interface MovieDto {
  id: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number;
  releaseDate: string;
  posterUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toMovieDto(movie: Movie): MovieDto {
  return {
    id: movie.id,
    title: movie.title,
    synopsis: movie.synopsis,
    durationMinutes: movie.durationMinutes,
    releaseDate: movie.releaseDate.toISOString().slice(0, 10),
    posterUrl: movie.posterUrl,
    isActive: movie.isActive,
    createdAt: movie.createdAt.toISOString(),
    updatedAt: movie.updatedAt.toISOString(),
  };
}

function readPositiveInteger(
  value: unknown,
  fieldName: string,
  maximum?: number,
): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new MovieValidationError(`${fieldName} phải là số nguyên dương.`);
  }

  if (maximum !== undefined && parsed > maximum) {
    throw new MovieValidationError(`${fieldName} không được lớn hơn ${maximum}.`);
  }

  return parsed;
}

export function parseMovieId(value: string): number {
  return readPositiveInteger(value, "ID phim");
}

function readRequiredText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MovieValidationError(`${fieldName} phải là chuỗi không rỗng.`);
  }

  const text = value.trim();
  if (text.length > maximumLength) {
    throw new MovieValidationError(
      `${fieldName} không được vượt quá ${maximumLength} ký tự.`,
    );
  }

  return text;
}

function readNullableText(
  value: unknown,
  fieldName: string,
  maximumLength?: number,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new MovieValidationError(`${fieldName} phải là chuỗi hoặc null.`);
  }

  const text = value.trim();
  if (maximumLength !== undefined && text.length > maximumLength) {
    throw new MovieValidationError(
      `${fieldName} không được vượt quá ${maximumLength} ký tự.`,
    );
  }

  return text || null;
}

function readReleaseDate(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MovieValidationError("releaseDate phải có định dạng YYYY-MM-DD.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new MovieValidationError("releaseDate không phải ngày hợp lệ.");
  }

  return date;
}

function requireObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new MovieValidationError("Body phải là một JSON object.");
  }

  return value as Record<string, unknown>;
}

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readCreateData(value: unknown): MovieWriteData {
  const body = requireObject(value);

  return {
    title: readRequiredText(body.title, "title", 255),
    synopsis: readNullableText(body.synopsis, "synopsis"),
    durationMinutes: readPositiveInteger(
      body.durationMinutes,
      "durationMinutes",
      600,
    ),
    releaseDate: readReleaseDate(body.releaseDate),
    posterUrl: readNullableText(body.posterUrl, "posterUrl", 2048),
    isActive: body.isActive === undefined ? true : readBoolean(body.isActive),
  };
}

function readBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new MovieValidationError("isActive phải là true hoặc false.");
  }

  return value;
}

function readUpdateData(value: unknown): MovieUpdateData {
  const body = requireObject(value);
  const data: MovieUpdateData = {};

  if (hasOwn(body, "title")) {
    data.title = readRequiredText(body.title, "title", 255);
  }
  if (hasOwn(body, "synopsis")) {
    data.synopsis = readNullableText(body.synopsis, "synopsis");
  }
  if (hasOwn(body, "durationMinutes")) {
    data.durationMinutes = readPositiveInteger(
      body.durationMinutes,
      "durationMinutes",
      600,
    );
  }
  if (hasOwn(body, "releaseDate")) {
    data.releaseDate = readReleaseDate(body.releaseDate);
  }
  if (hasOwn(body, "posterUrl")) {
    data.posterUrl = readNullableText(body.posterUrl, "posterUrl", 2048);
  }
  if (hasOwn(body, "isActive")) {
    data.isActive = readBoolean(body.isActive);
  }

  if (Object.keys(data).length === 0) {
    throw new MovieValidationError("Body không có trường phim hợp lệ để cập nhật.");
  }

  return data;
}

export async function listMovies(query: Record<string, unknown>) {
  const page = query.page === undefined ? 1 : readPositiveInteger(query.page, "page");
  const limit =
    query.limit === undefined
      ? 10
      : readPositiveInteger(query.limit, "limit", MAX_PAGE_SIZE);

  let isActive: boolean | undefined;
  if (query.active !== undefined) {
    if (query.active !== "true" && query.active !== "false") {
      throw new MovieValidationError("active phải là true hoặc false.");
    }
    isActive = query.active === "true";
  }

  const { items, total } = await findMoviePage(
    (page - 1) * limit,
    limit,
    isActive,
  );

  return {
    data: items.map(toMovieDto),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMovie(id: number): Promise<MovieDto> {
  const movie = await findMovieById(id);
  if (!movie) {
    throw new MovieNotFoundError(id);
  }

  return toMovieDto(movie);
}

export async function createMovie(body: unknown): Promise<MovieDto> {
  return toMovieDto(await insertMovie(readCreateData(body)));
}

export async function updateMovie(id: number, body: unknown): Promise<MovieDto> {
  await getMovie(id);
  return toMovieDto(await updateMovieById(id, readUpdateData(body)));
}

export async function deactivateMovie(id: number): Promise<void> {
  await getMovie(id);
  await updateMovieById(id, { isActive: false });
}

