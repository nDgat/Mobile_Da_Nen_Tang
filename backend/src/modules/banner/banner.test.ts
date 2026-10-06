import assert from "node:assert/strict";
import { after, test, mock } from "node:test";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../database/prisma.js";
import { createAccessToken } from "../auth/jwt.js";
import { bannerRepository } from "./banner.repository.js";

let stored: { id: number; imageUrl: string; title: string; backgroundUrl?: string } | null = null;
mock.method(bannerRepository, "read", async () => stored);
const writes = mock.method(bannerRepository, "save", async (data: { imageUrl: string; title: string; backgroundUrl?: string }) => { stored = { id: 1, ...data }; return stored; });
after(async () => { mock.restoreAll(); await prisma.$disconnect(); });
test("banner: public read, ADMIN write, validation and shared readback", async () => {
  const initial = await request(app).get("/api/v1/banner").expect(200);
  assert.equal(initial.body.data.imageUrl, "");
  const data = { imageUrl: "https://example.com/banner.jpg", title: "CineBook", backgroundUrl: "https://example.com/background.jpg" };
  await request(app).put("/api/v1/banner").send(data).expect(401);
  const customer = createAccessToken({ userId: 1, role: "CUSTOMER" });
  await request(app).put("/api/v1/banner").auth(customer, { type: "bearer" }).send(data).expect(403);
  const admin = createAccessToken({ userId: 2, role: "ADMIN" });
  for (const imageUrl of ["file:///C:/photo.jpg", "javascript:alert(1)", "invalid"]) {
    await request(app).put("/api/v1/banner").auth(admin, { type: "bearer" }).send({ ...data, imageUrl }).expect(400);
  }
  assert.equal(writes.mock.callCount(), 0);
  await request(app).put("/api/v1/banner").auth(admin, { type: "bearer" }).send(data).expect(200);
  const updated = await request(app).get("/api/v1/banner").expect(200);
  assert.equal(updated.body.data.imageUrl, data.imageUrl);
  assert.equal(updated.body.data.backgroundUrl, data.backgroundUrl);
  await request(app).put("/api/v1/banner").auth(admin, { type: "bearer" }).send({ ...data, backgroundUrl: "javascript:alert(1)" }).expect(400);
  await request(app).put("/api/v1/banner").auth(admin, { type: "bearer" }).send({ ...data, imageUrl: "" }).expect(200);
  assert.equal((await request(app).get("/api/v1/banner")).body.data.imageUrl, "");
});
