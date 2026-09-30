import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../app.js";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";

const suffix = `${process.pid}-${Date.now()}`;
const customerEmail = `integration-customer-${suffix}@example.com`;
const adminEmail = `integration-admin-${suffix}@example.com`;
const password = "Integration123";
let adminAccessToken = "";
let customerAccessToken = "";
let showtimeId = 0;
let showtimeSeatId = 0;
let bookingId = 0;

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({ where: { email: { in: [customerEmail, adminEmail] } }, select: { id: true } });
  const userIds = users.map(user => user.id);
  if (userIds.length === 0) return;
  const bookings = await prisma.booking.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
  const bookingIds = bookings.map(booking => booking.id);
  await prisma.$transaction(async transaction => {
    if (bookingIds.length > 0) {
      await transaction.showtimeSeat.updateMany({ where: { currentBookingId: { in: bookingIds } }, data: { status: "AVAILABLE", currentBookingId: null, holdExpiresAt: null } });
      await transaction.notification.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await transaction.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await transaction.bookingConcessionItem.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await transaction.bookingSeat.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await transaction.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    await transaction.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await transaction.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await transaction.notification.deleteMany({ where: { userId: { in: userIds } } });
    await transaction.movieReview.deleteMany({ where: { userId: { in: userIds } } });
    await transaction.movieFavorite.deleteMany({ where: { userId: { in: userIds } } });
    await transaction.user.deleteMany({ where: { id: { in: userIds } } });
  });
}

describe("CineBook API integration", { concurrency: false }, () => {
  before(async () => {
    assert.equal(env.nodeEnv, "development", "Integration test chỉ chạy trong development.");
    assert.equal(env.database.name, "cinebook", "Integration test chỉ chạy với database cinebook.");
    assert.ok(["127.0.0.1", "localhost"].includes(env.database.host), "Integration test chỉ chạy với MySQL local.");
    await cleanup();
    const passwordHash = await bcrypt.hash(password, 4);
    await prisma.user.create({ data: { email: adminEmail, fullName: "Integration Admin", passwordHash, role: "ADMIN" } });
    const showtime = await prisma.showtime.findFirstOrThrow({
      where: { status: "SCHEDULED", startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" },
      include: { seats: { where: { status: "AVAILABLE", currentBookingId: null }, take: 1 } },
    });
    assert.ok(showtime.seats[0], "Cần ít nhất một ghế trống trong tương lai.");
    showtimeId = showtime.id;
    showtimeSeatId = showtime.seats[0]!.id;
  });

  after(async () => { await cleanup(); await prisma.$disconnect(); });

  it("phục vụ health, OpenAPI và CORS preflight", async () => {
    const health = await request(app).get("/health").expect(200);
    assert.equal(health.body.status, "ok");
    const docs = await request(app).get("/api-docs.json").expect(200);
    assert.equal(docs.body.openapi, "3.0.3");
    const preflight = await request(app).options("/api/v1/movies").set("Origin", "http://localhost:8081").set("Access-Control-Request-Method", "GET").expect(204);
    assert.equal(preflight.headers["access-control-allow-origin"], "http://localhost:8081");
  });

  it("đăng ký, đăng nhập, refresh xoay vòng và logout thu hồi token", async () => {
    await request(app).post("/api/v1/auth/register").send({ fullName: "Integration Customer", email: customerEmail, password }).expect(201);
    const login = await request(app).post("/api/v1/auth/login").send({ email: customerEmail, password }).expect(200);
    const originalRefresh = login.body.data.refreshToken as string;
    customerAccessToken = login.body.data.accessToken as string;
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${customerAccessToken}`).expect(200);
    assert.equal(me.body.data.email, customerEmail);
    const refreshed = await request(app).post("/api/v1/auth/refresh").send({ refreshToken: originalRefresh }).expect(200);
    await request(app).post("/api/v1/auth/refresh").send({ refreshToken: originalRefresh }).expect(401);
    await request(app).post("/api/v1/auth/logout").send({ refreshToken: refreshed.body.data.refreshToken }).expect(204);
    await request(app).post("/api/v1/auth/refresh").send({ refreshToken: refreshed.body.data.refreshToken }).expect(401);
  });

  it("phân quyền CUSTOMER và ADMIN đúng", async () => {
    const customerLogin = await request(app).post("/api/v1/auth/login").send({ email: customerEmail, password }).expect(200);
    customerAccessToken = customerLogin.body.data.accessToken as string;
    await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${customerAccessToken}`).expect(403);
    const adminLogin = await request(app).post("/api/v1/auth/login").send({ email: adminEmail, password }).expect(200);
    adminAccessToken = adminLogin.body.data.accessToken as string;
    const dashboard = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${adminAccessToken}`).expect(200);
    assert.equal(typeof dashboard.body.data.users, "number");
  });

  it("validation trả lỗi có request ID", async () => {
    const response = await request(app).post("/api/v1/auth/login").set("X-Request-Id", "integration-validation").send({ email: "sai", password: "" }).expect(400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
    assert.equal(response.body.error.requestId, "integration-validation");
    assert.ok(response.body.error.details.length >= 1);
  });

  it("giữ ghế, bảo vệ quyền sở hữu và hủy giữ ghế", async () => {
    const hold = await request(app).post(`/api/v1/showtimes/${showtimeId}/hold-seats`).set("Authorization", `Bearer ${customerAccessToken}`).send({ showtimeSeatIds: [showtimeSeatId] }).expect(201);
    bookingId = hold.body.data.id as number;
    assert.equal(hold.body.data.seats[0].id, showtimeSeatId);
    await request(app).get(`/api/v1/bookings/${bookingId}`).set("Authorization", `Bearer ${customerAccessToken}`).expect(200);
    await request(app).get(`/api/v1/bookings/${bookingId}`).set("Authorization", `Bearer ${adminAccessToken}`).expect(404);
    await request(app).delete(`/api/v1/bookings/${bookingId}/hold`).set("Authorization", `Bearer ${customerAccessToken}`).expect(204);
    const seat = await prisma.showtimeSeat.findUniqueOrThrow({ where: { id: showtimeSeatId } });
    assert.equal(seat.status, "AVAILABLE");
    assert.equal(seat.currentBookingId, null);
  });
});
