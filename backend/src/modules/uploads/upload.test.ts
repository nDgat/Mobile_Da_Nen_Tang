import assert from "node:assert/strict";
import { test } from "node:test";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import request from "supertest";
import { app } from "../../app.js";
import { createAccessToken } from "../auth/jwt.js";
import { uploadDirectory } from "./upload.routes.js";

test("upload: ADMIN only, reject non-images, encode JPEG and serve publicly", async () => {
  const token = createAccessToken({ userId: 1, role: "ADMIN" });
  await request(app).post("/api/v1/uploads").send({ base64: "abc" }).expect(401);
  await request(app).post("/api/v1/uploads").auth(createAccessToken({ userId: 2, role: "CUSTOMER" }), { type: "bearer" }).send({ base64: "abc" }).expect(403);
  await request(app).post("/api/v1/uploads").auth(token, { type: "bearer" }).send({ base64: Buffer.from("<svg></svg>").toString("base64") }).expect(400);
  const input = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().toBuffer();
  const response = await request(app).post("/api/v1/uploads").auth(token, { type: "bearer" }).send({ base64: input.toString("base64") }).expect(201);
  const url = response.body.data.url as string;
  assert.match(url, /^\/uploads\/[a-f0-9-]{36}\.jpg$/);
  try {
    const image = await request(app).get(url).expect(200).expect("Content-Type", /image\/jpeg/);
    assert.equal(image.headers["x-content-type-options"], "nosniff");
    assert.equal((await sharp(image.body as Buffer).metadata()).format, "jpeg");
  } finally { await unlink(join(uploadDirectory, url.slice("/uploads/".length))); }
});
