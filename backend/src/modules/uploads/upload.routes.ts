import { Router, json, static as serveStatic } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";

export const uploadDirectory = fileURLToPath(new URL("../../../uploads/", import.meta.url));
export const uploadedImages = serveStatic(uploadDirectory, { index: false, dotfiles: "deny", maxAge: "1y", immutable: true, setHeaders: res => { res.setHeader("X-Content-Type-Options", "nosniff"); } });
export const uploadRouter = Router();
uploadRouter.post("/", requireAuthentication, requireRole("ADMIN"), json({ limit: "8mb" }), async (req, res) => {
  const base64: unknown = req.body?.base64;
  if (typeof base64 !== "string" || base64.length === 0 || base64.length > 7_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    res.status(400).json({ error: { message: "Ảnh không hợp lệ hoặc vượt quá 5 MB." } }); return;
  }
  const input = Buffer.from(base64, "base64");
  if (input.length > 5 * 1024 * 1024) { res.status(413).json({ error: { message: "Ảnh tối đa 5 MB." } }); return; }
  let output: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) throw new Error("Unsupported image");
    output = await image.rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  } catch { res.status(400).json({ error: { message: "Hãy chọn ảnh JPG, PNG hoặc WebP hợp lệ (tối đa 40 megapixel)." } }); return; }
  const filename = `${randomUUID()}.jpg`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(join(uploadDirectory, filename), output, { flag: "wx" });
  res.status(201).json({ data: { url: `/uploads/${filename}` } });
});
