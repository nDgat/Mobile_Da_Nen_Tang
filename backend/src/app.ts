import express, { type ErrorRequestHandler } from "express";

import { checkDatabaseConnection } from "./database/mysql.js";
import { checkPrismaConnection } from "./database/prisma.js";
import { apiRouter } from "./routes/api.routes.js";

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

app.use("/api/v1", apiRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Không tìm thấy endpoint.",
    },
  });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error("Lỗi khi xử lý request:", error);

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response.status(400).json({
      error: {
        code: "MALFORMED_JSON",
        message: "Nội dung JSON không đúng cú pháp.",
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Đã xảy ra lỗi phía server.",
    },
  });
};

app.use(errorHandler);
