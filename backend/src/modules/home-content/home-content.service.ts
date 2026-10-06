import type { HomeContentDisplay, HomeContentSection } from "../../generated/prisma/client.js";
import { findHomeContent, findHomeContentPage, insertHomeContent, updateHomeContent, type HomeContentWriteData } from "./home-content.repository.js";

const SECTIONS = ["BANNER", "HOT_NEWS", "VOUCHER", "PARTNER_PROMOTION"] as const;
const DISPLAYS = ["HERO", "CARD", "SQUARE"] as const;
export class HomeContentValidationError extends Error {}
export class HomeContentNotFoundError extends Error {}

function object(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new HomeContentValidationError("Body must be a JSON object.");
  return value as Record<string, unknown>;
}
function positive(value: unknown, field: string, fallback?: number) {
  if (value === undefined && fallback !== undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new HomeContentValidationError(`${field} must be a positive integer.`);
  return parsed;
}
function section(value: unknown): HomeContentSection {
  if (typeof value !== "string" || !SECTIONS.includes(value as typeof SECTIONS[number])) throw new HomeContentValidationError("Invalid section.");
  return value as HomeContentSection;
}
function displayStyle(value: unknown): HomeContentDisplay {
  if (typeof value !== "string" || !DISPLAYS.includes(value as typeof DISPLAYS[number])) throw new HomeContentValidationError("Invalid displayStyle.");
  return value as HomeContentDisplay;
}
function text(value: unknown, field: string, max: number, optional = false) {
  if ((value === undefined || value === null || value === "") && optional) return null;
  if (typeof value !== "string" || !value.trim()) throw new HomeContentValidationError(`${field} is required.`);
  if (value.trim().length > max) throw new HomeContentValidationError(`${field} cannot exceed ${max} characters.`);
  return value.trim();
}
function url(value: unknown, field: string) {
  const parsed = text(value, field, 2048, true);
  if (!parsed) return null;
  if (parsed.startsWith("/uploads/") && /^\/uploads\/[a-f0-9-]{36}\.jpg$/.test(parsed)) return parsed;
  if (field === "linkUrl" && parsed.startsWith("/") && !parsed.startsWith("//")) return parsed;
  try { if (["http:", "https:"].includes(new URL(parsed).protocol)) return parsed; } catch {}
  throw new HomeContentValidationError(`${field} must be an internal path or an HTTP(S) URL.`);
}
function active(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new HomeContentValidationError("isActive must be boolean.");
  return value;
}
function writeData(value: unknown, current?: HomeContentWriteData): HomeContentWriteData {
  const body = object(value);
  return {
    section: body.section === undefined && current ? current.section : section(body.section),
    title: body.title === undefined && current ? current.title : text(body.title, "title", 180) as string,
    subtitle: body.subtitle === undefined && current ? current.subtitle : text(body.subtitle, "subtitle", 500, true),
    imageUrl: body.imageUrl === undefined && current ? current.imageUrl : url(body.imageUrl, "imageUrl"),
    linkUrl: body.linkUrl === undefined && current ? current.linkUrl : url(body.linkUrl, "linkUrl"),
    badge: body.badge === undefined && current ? current.badge : text(body.badge, "badge", 60, true),
    displayStyle: body.displayStyle === undefined && current ? current.displayStyle : displayStyle(body.displayStyle ?? "CARD"),
    sortOrder: body.sortOrder === undefined && current ? current.sortOrder : positive(body.sortOrder, "sortOrder", 1),
    isActive: active(body.isActive, current?.isActive ?? true),
  };
}
export const parseHomeContentId = (value: string) => positive(value, "Content ID");

export async function listHomeContent(query: Record<string, unknown>) {
  const page = positive(query.page, "page", 1);
  const limit = positive(query.limit, "limit", 30);
  if (limit > 100) throw new HomeContentValidationError("limit cannot exceed 100.");
  const selectedSection = query.section === undefined ? undefined : section(query.section);
  let isActive: boolean | undefined;
  if (query.active !== undefined) {
    if (query.active !== "true" && query.active !== "false") throw new HomeContentValidationError("active must be true or false.");
    isActive = query.active === "true";
  }
  const { items, total } = await findHomeContentPage((page - 1) * limit, limit, selectedSection, isActive);
  return { data: items.map(item => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export const createHomeContent = (body: unknown) => insertHomeContent(writeData(body));
export async function editHomeContent(id: number, body: unknown) {
  const current = await findHomeContent(id);
  if (!current) throw new HomeContentNotFoundError("Home content item was not found.");
  return updateHomeContent(id, writeData(body, current));
}
