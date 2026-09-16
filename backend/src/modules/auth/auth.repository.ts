import { prisma } from "../../database/prisma.js";
export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });
export const insertCustomer = (data: { email: string; passwordHash: string; fullName: string }) => prisma.user.create({ data: { ...data, role: "CUSTOMER", isActive: true } });

