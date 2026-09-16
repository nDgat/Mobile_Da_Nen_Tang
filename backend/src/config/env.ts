import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

dotenv.config({
  path: [resolve(backendDirectory, ".env"), resolve(backendDirectory, "../.env")],
  quiet: true,
});

const DEFAULT_PORT = 3000;

function readPort(value: string | undefined, fallback?: number): number {
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error("Thiếu biến môi trường chứa port.");
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT phải là số nguyên từ 1 đến 65535.");
  }

  return port;
}

function readRequired(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return value;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("JWT_ACCESS_TTL_SECONDS phải là số nguyên dương.");
  }
  return parsed;
}

function readJwtSecret(): string {
  const secret = readRequired("JWT_ACCESS_SECRET");
  if (secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET phải có ít nhất 32 ký tự.");
  }
  return secret;
}

export const env = {
  database: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    name: readRequired("MYSQL_DATABASE"),
    password: readRequired("MYSQL_PASSWORD"),
    port: readPort(process.env.MYSQL_PORT),
    user: readRequired("MYSQL_USER"),
  },
  host: process.env.HOST ?? "0.0.0.0",
  jwt: {
    accessSecret: readJwtSecret(),
    accessTtlSeconds: readPositiveInteger(process.env.JWT_ACCESS_TTL_SECONDS, 900),
    audience: "cinebook-mobile",
    issuer: "cinebook-api",
    refreshTtlSeconds: readPositiveInteger(process.env.JWT_REFRESH_TTL_SECONDS, 2_592_000),
  },
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT, DEFAULT_PORT),
};
