import { env } from "../config/env.js";

export type LogLevel = "debug" | "info" | "warn" | "error";
const weights: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const sensitiveKey = /password|token|secret|authorization|cookie|api[-_]?key/i;

function sanitize(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (depth > 6) return "[MAX_DEPTH]";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => sanitize(item, seen, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : sanitize(item, seen, depth + 1)]));
}

function write(level: LogLevel, event: string, metadata: Record<string, unknown> = {}) {
  const configuredLevel = env.logLevel;
  if (configuredLevel === "silent" || weights[level] < weights[configuredLevel]) return;
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, service: "cinebook-api", event, ...sanitize(metadata) as Record<string, unknown> });
  (level === "error" ? process.stderr : process.stdout).write(`${line}\n`);
}

export const logger = {
  debug: (event: string, metadata?: Record<string, unknown>) => write("debug", event, metadata),
  info: (event: string, metadata?: Record<string, unknown>) => write("info", event, metadata),
  warn: (event: string, metadata?: Record<string, unknown>) => write("warn", event, metadata),
  error: (event: string, metadata?: Record<string, unknown>) => write("error", event, metadata),
};
