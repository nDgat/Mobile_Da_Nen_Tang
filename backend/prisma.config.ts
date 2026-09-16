import { resolve } from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: [resolve(import.meta.dirname, ".env"), resolve(import.meta.dirname, "../.env")],
  quiet: true,
});

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return value;
}

const user = encodeURIComponent(required("MYSQL_USER"));
const password = encodeURIComponent(required("MYSQL_PASSWORD"));
const host = process.env.MYSQL_HOST ?? "127.0.0.1";
const port = process.env.MYSQL_PORT ?? "3306";
const database = encodeURIComponent(required("MYSQL_DATABASE"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/scripts/seed.ts",
  },
  datasource: {
    url: `mysql://${user}:${password}@${host}:${port}/${database}`,
  },
});
