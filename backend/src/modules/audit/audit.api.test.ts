import assert from "node:assert/strict";
import { after, mock, test } from "node:test";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../database/prisma.js";
import { auditRepository } from "./audit.repository.js";
import { createAccessToken } from "../auth/jwt.js";

const read = mock.method(auditRepository, "findPage", async () => ({ items: [{
  id: 7, actorId: 2, action: "USER_STATUS_CHANGED", entityType: "User", entityId: "8",
  createdAt: new Date("2026-10-06T05:00:00Z"), beforeData: { isActive: true }, afterData: { isActive: false },
  actor: { id: 2, email: "admin@example.com", fullName: "Test Admin", role: "ADMIN" },
  requestId: "test-audit", ipAddress: "127.0.0.1", userAgent: "Test",
}], total: 21 }));
after(async () => { mock.restoreAll(); await prisma.$disconnect(); });
test("audit API enforces ADMIN access, validates filters and returns paginated details", async () => {
  const endpoint = "/api/v1/admin/audit-logs";
  await request(app).get(endpoint).expect(401);
  await request(app).get(endpoint).auth(createAccessToken({ userId: 1, role: "CUSTOMER" }), { type: "bearer" }).expect(403);
  const token = createAccessToken({ userId: 2, role: "ADMIN" });
  for (const query of [{ from: "2026-02-30" }, { from: "2026-10-07", to: "2026-10-06" }, { limit: 101 }]) {
    await request(app).get(endpoint).auth(token, { type: "bearer" }).query(query).expect(400);
  }
  assert.equal(read.mock.callCount(), 0);
  const response = await request(app).get(endpoint).auth(token, { type: "bearer" })
    .query({ page: 2, limit: 20, search: "admin", from: "2026-10-06", to: "2026-10-06" }).expect(200);
  assert.deepEqual(response.body.meta, { page: 2, limit: 20, total: 21, totalPages: 2 });
  assert.equal(response.body.data[0].createdAt, "2026-10-06T05:00:00.000Z");
  assert.deepEqual(response.body.data[0].beforeData, { isActive: true });
  assert.equal(response.body.data[0].actor.email, "admin@example.com");
});


