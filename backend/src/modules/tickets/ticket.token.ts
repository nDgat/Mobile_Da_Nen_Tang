import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";

interface TicketPayload { v: 1; bookingId: number; bookingCode: string; }

function signature(payload: string) {
  return createHmac("sha256", env.jwt.accessSecret).update(payload).digest("base64url");
}

export function createTicketToken(bookingId: number, bookingCode: string) {
  const payload = Buffer.from(JSON.stringify({ v: 1, bookingId, bookingCode } satisfies TicketPayload)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyTicketToken(value: string): TicketPayload {
  const token = value.startsWith("CINEBOOK:") ? value.slice("CINEBOOK:".length) : value;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) throw new Error("QR không hợp lệ.");
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error("Chữ ký QR không hợp lệ.");
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<TicketPayload>;
  if (parsed.v !== 1 || !Number.isInteger(parsed.bookingId) || Number(parsed.bookingId) <= 0 || typeof parsed.bookingCode !== "string") throw new Error("Nội dung QR không hợp lệ.");
  return parsed as TicketPayload;
}
