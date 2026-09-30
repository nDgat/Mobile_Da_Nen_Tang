import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateVoucher, type VoucherRule } from "./voucher.pricing.js";

const now = new Date("2026-09-24T00:00:00.000Z");
const baseRule: VoucherRule = { discountType: "PERCENTAGE", discountValue: "10", minOrderAmount: "100000", maxDiscountAmount: "50000", startsAt: new Date("2026-01-01T00:00:00.000Z"), endsAt: new Date("2027-01-01T00:00:00.000Z"), usageLimit: 100, usedCount: 0, isActive: true };

describe("evaluateVoucher", () => {
  it("tính phần trăm và áp dụng mức giảm tối đa", () => {
    assert.deepEqual(evaluateVoucher(baseRule, 200_000n, now), { valid: true, discountAmount: 20_000n });
    assert.deepEqual(evaluateVoucher(baseRule, 1_000_000n, now), { valid: true, discountAmount: 50_000n });
  });

  it("tính giảm cố định và không vượt tổng đơn", () => {
    const rule = { ...baseRule, discountType: "FIXED" as const, discountValue: "500000", minOrderAmount: "0", maxDiscountAmount: null };
    assert.deepEqual(evaluateVoucher(rule, 120_000n, now), { valid: true, discountAmount: 120_000n });
  });

  it("trả đúng lý do khi voucher không sử dụng được", () => {
    assert.deepEqual(evaluateVoucher({ ...baseRule, isActive: false }, 200_000n, now), { valid: false, reason: "INACTIVE" });
    assert.deepEqual(evaluateVoucher({ ...baseRule, startsAt: new Date("2026-10-01") }, 200_000n, now), { valid: false, reason: "NOT_STARTED" });
    assert.deepEqual(evaluateVoucher({ ...baseRule, endsAt: new Date("2026-09-01") }, 200_000n, now), { valid: false, reason: "EXPIRED" });
    assert.deepEqual(evaluateVoucher({ ...baseRule, usedCount: 100 }, 200_000n, now), { valid: false, reason: "OUT_OF_USES" });
    assert.deepEqual(evaluateVoucher(baseRule, 99_999n, now), { valid: false, reason: "MIN_ORDER" });
    assert.deepEqual(evaluateVoucher({ ...baseRule, discountValue: "101" }, 200_000n, now), { valid: false, reason: "INVALID_VALUE" });
  });
});
