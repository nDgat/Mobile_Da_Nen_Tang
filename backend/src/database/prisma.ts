import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const adapter = new PrismaMariaDb({
  connectionLimit: 5,
  database: env.database.name,
  host: env.database.host,
  password: env.database.password,
  port: env.database.port,
  user: env.database.user,
});

export const prisma = new PrismaClient({ adapter });

export async function checkPrismaConnection(): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ version: string }>>`
    SELECT VERSION() AS version
  `;
  const databaseInfo = rows[0];

  if (!databaseInfo) {
    throw new Error("Prisma không nhận được phản hồi từ MySQL.");
  }

  return databaseInfo.version;
}

export async function closePrismaConnection(): Promise<void> {
  await prisma.$disconnect();
}
