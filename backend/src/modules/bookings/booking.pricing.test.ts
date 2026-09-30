import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBookingPricing, SERVICE_FEE_PER_SEAT } from "./booking.pricing.js";

describe("calculateBookingPricing", () => {
  it("cộng tiền ghế, phí dịch vụ và bắp nước", () => {
    assert.deepEqual(calculateBookingPricing([80_000n, 100_000n], 45_000n), {
      seatSubtotal: 180_000n,
      serviceFee: SERVICE_FEE_PER_SEAT * 2n,
      concessionSubtotal: 45_000n,
      discountAmount: 0n,
      totalAmount: 235_000n,
    });
  });

  it("trừ giảm giá và không cho tổng tiền âm", () => {
    assert.equal(calculateBookingPricing([80_000n], 0n, 10_000n).totalAmount, 75_000n);
    const fullyDiscounted = calculateBookingPricing([80_000n], 0n, 999_999n);
    assert.equal(fullyDiscounted.discountAmount, 85_000n);
    assert.equal(fullyDiscounted.totalAmount, 0n);
  });

  it("từ chối danh sách rỗng và giá trị âm", () => {
    assert.throws(() => calculateBookingPricing([]), /không hợp lệ/);
    assert.throws(() => calculateBookingPricing([-1n]), /không hợp lệ/);
    assert.throws(() => calculateBookingPricing([1n], -1n), /không hợp lệ/);
    assert.throws(() => calculateBookingPricing([1n], 0n, -1n), /không hợp lệ/);
  });
});
