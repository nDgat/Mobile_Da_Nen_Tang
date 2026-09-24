import { findAvailableVouchers } from "./voucher.repository.js";

export async function listVouchers() {
  const items = await findAvailableVouchers(new Date());
  return items.map(item => ({
    id: item.id, code: item.code, name: item.name, description: item.description,
    discountType: item.discountType, discountValue: item.discountValue.toString(),
    minOrderAmount: item.minOrderAmount.toString(), maxDiscountAmount: item.maxDiscountAmount?.toString() ?? null,
    startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(),
  }));
}
