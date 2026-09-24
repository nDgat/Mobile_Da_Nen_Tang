import express from "express";

import { checkDatabaseConnection } from "./database/mysql.js";
import { checkPrismaConnection } from "./database/prisma.js";
import { apiRouter } from "./routes/api.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { requestLogger } from "./middleware/request-logger.js";

export const app = express();

app.disable("x-powered-by");
app.use(requestContext);
app.use(requestLogger);
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

app.use(notFoundHandler);
app.use(errorHandler);
