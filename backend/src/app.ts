import express from "express";
import { uploadRouter, uploadedImages } from "./modules/uploads/upload.routes.js";
import swaggerUi from "swagger-ui-express";

import { checkDatabaseConnection } from "./database/mysql.js";
import { checkPrismaConnection } from "./database/prisma.js";
import { apiRouter } from "./routes/api.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { requestLogger } from "./middleware/request-logger.js";
import { cors } from "./middleware/cors.js";
import { openApiDocument } from "./docs/openapi.js";

export const app = express();

app.disable("x-powered-by");
app.use(requestContext);
app.use(requestLogger);
app.use(cors);
app.use("/api/v1/uploads", uploadRouter);
app.use("/uploads", uploadedImages);
app.use(express.json());

app.get("/api-docs.json", (_request, response) => response.json(openApiDocument));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: "CineBook API Docs" }));

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
