import { prisma } from "../../database/prisma.js";

export const findActiveConcessions = () => prisma.concessionProduct.findMany({
  where: { isActive: true },
  orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
});
