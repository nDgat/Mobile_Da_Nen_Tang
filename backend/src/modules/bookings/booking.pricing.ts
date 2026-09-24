export const SERVICE_FEE_PER_SEAT = 5_000n;

export function calculateBookingPricing(seatPrices: bigint[], concessionSubtotal = 0n, requestedDiscount = 0n) {
  if (seatPrices.length === 0 || seatPrices.some(price => price < 0n) || concessionSubtotal < 0n || requestedDiscount < 0n) {
    throw new Error("Dữ liệu tính tiền không hợp lệ.");
  }
  const seatSubtotal = seatPrices.reduce((sum, price) => sum + price, 0n);
  const serviceFee = SERVICE_FEE_PER_SEAT * BigInt(seatPrices.length);
  const beforeDiscount = seatSubtotal + serviceFee + concessionSubtotal;
  const discountAmount = requestedDiscount > beforeDiscount ? beforeDiscount : requestedDiscount;
  return { seatSubtotal, serviceFee, concessionSubtotal, discountAmount, totalAmount: beforeDiscount - discountAmount };
}
