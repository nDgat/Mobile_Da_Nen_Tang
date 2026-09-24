import { prisma } from "../../database/prisma.js";

export const findAvailableVouchers = (now: Date) => prisma.voucher.findMany({
  where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now }, OR: [{ usageLimit: null }, { usedCount: { lt: prisma.voucher.fields.usageLimit } }] },
  orderBy: [{ minOrderAmount: "asc" }, { id: "asc" }],
});
