export interface VoucherRule {
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string | null;
  startsAt: Date;
  endsAt: Date;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

export type VoucherInvalidReason = "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "OUT_OF_USES" | "MIN_ORDER" | "INVALID_VALUE";

export function evaluateVoucher(rule: VoucherRule, orderAmount: bigint, now = new Date()): { valid: true; discountAmount: bigint } | { valid: false; reason: VoucherInvalidReason } {
  if (!rule.isActive) return { valid: false, reason: "INACTIVE" };
  if (rule.startsAt > now) return { valid: false, reason: "NOT_STARTED" };
  if (rule.endsAt < now) return { valid: false, reason: "EXPIRED" };
  if (rule.usageLimit !== null && rule.usedCount >= rule.usageLimit) return { valid: false, reason: "OUT_OF_USES" };
  if (orderAmount < BigInt(rule.minOrderAmount)) return { valid: false, reason: "MIN_ORDER" };
  const value = BigInt(rule.discountValue);
  if (value <= 0n || (rule.discountType === "PERCENTAGE" && value > 100n)) return { valid: false, reason: "INVALID_VALUE" };
  let discountAmount = rule.discountType === "FIXED" ? value : orderAmount * value / 100n;
  if (rule.maxDiscountAmount !== null) { const cap = BigInt(rule.maxDiscountAmount); if (discountAmount > cap) discountAmount = cap; }
  if (discountAmount > orderAmount) discountAmount = orderAmount;
  return { valid: true, discountAmount };
}
