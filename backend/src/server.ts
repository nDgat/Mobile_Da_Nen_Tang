import { app } from "./app.js";
import { env } from "./config/env.js";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./database/mysql.js";
import {
  checkPrismaConnection,
  closePrismaConnection,
} from "./database/prisma.js";
import { logger } from "./logging/logger.js";

const database = await checkDatabaseConnection();
const prismaVersion = await checkPrismaConnection();

logger.info("database.connected", { mysqlVersion: database.version, database: database.name, prismaMysqlVersion: prismaVersion });

const server = app.listen(env.port, env.host, () => {
  logger.info("server.started", { host: env.host, port: env.port, environment: env.nodeEnv });
});

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info("server.shutdown.started", { signal });

  server.close((error) => {
    if (error) {
      logger.error("server.shutdown.failed", { error });
      process.exit(1);
    }

    void Promise.all([closeDatabaseConnection(), closePrismaConnection()])
      .then(() => { logger.info("server.shutdown.completed", { signal }); process.exit(0); })
      .catch((databaseError: unknown) => {
        logger.error("database.shutdown.failed", { error: databaseError });
        process.exit(1);
      });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", error => { logger.error("process.uncaught_exception", { error }); shutdown("uncaughtException"); });
process.on("unhandledRejection", reason => { logger.error("process.unhandled_rejection", { error: reason }); shutdown("unhandledRejection"); });
