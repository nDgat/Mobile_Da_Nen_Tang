import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditQuerySchema, auditWhere } from "./audit.query.js";

describe("audit log filters", () => {
  it("bounds an inclusive Vietnam calendar day correctly in UTC", () => {
    const where = auditWhere(auditQuerySchema.parse({ from: "2026-10-06", to: "2026-10-06" }));
    assert.deepEqual(where.createdAt, { gte: new Date("2026-10-05T17:00:00Z"), lt: new Date("2026-10-06T17:00:00Z") });
  });
  it("rejects invalid dates, reversed ranges and unbounded pages", () => {
    for (const input of [{ from: "2026-02-30" }, { from: "2026-10-07", to: "2026-10-06" }, { page: 0 }, { limit: 101 }, { actorId: -1 }]) {
      assert.equal(auditQuerySchema.safeParse(input).success, false);
    }
  });
  it("combines exact filters with search and preserves defaults", () => {
    const query = auditQuerySchema.parse({ actorId: "4", action: " USER_STATUS_CHANGED ", entityType: "User", search: " admin@example.com " });
    assert.equal(query.limit, 20);
    assert.equal(query.page, 1);
    const where = auditWhere(query);
    assert.equal(where.actorId, 4);
    assert.equal(where.action, "USER_STATUS_CHANGED");
    assert.equal(where.entityType, "User");
    assert.deepEqual(where.OR?.[1], { actor: { email: { contains: "admin@example.com" } } });
    assert.deepEqual(auditWhere(auditQuerySchema.parse({})), {});
  });
});

