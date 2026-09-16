import express, { type ErrorRequestHandler } from "express";

import { checkDatabaseConnection } from "./database/mysql.js";
import { checkPrismaConnection } from "./database/prisma.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    message: "CineBook API đang hoạt động.",
  });
});

app.get("/health", (_request, response) => {
  response.json({
    service: "cinebook-api",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/database", async (_request, response) => {
  const database = await checkDatabaseConnection();

  response.json({
    database,
    status: "ok",
  });
});

app.get("/health/prisma", async (_request, response) => {
  const version = await checkPrismaConnection();

  response.json({
    mysqlVersion: version,
    orm: "prisma",
    status: "ok",
  });
});

app.use((_request, response) => {
  response.status(404).json({
    error: "Không tìm thấy endpoint.",
  });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error("Lỗi khi xử lý request:", error);

  response.status(500).json({
    error: "Đã xảy ra lỗi phía server.",
  });
};

app.use(errorHandler);
