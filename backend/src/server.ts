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

const database = await checkDatabaseConnection();
const prismaVersion = await checkPrismaConnection();

console.log(`Đã kết nối MySQL ${database.version}, database ${database.name}.`);
console.log(`Prisma đã kết nối MySQL ${prismaVersion}.`);

const server = app.listen(env.port, env.host, () => {
  console.log(`CineBook API đang chạy tại http://${env.host}:${env.port} (${env.nodeEnv})`);
});

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Đã nhận ${signal}. Đang dừng CineBook API...`);

  server.close((error) => {
    if (error) {
      console.error("Không thể dừng server an toàn:", error);
      process.exit(1);
    }

    void Promise.all([closeDatabaseConnection(), closePrismaConnection()])
      .then(() => process.exit(0))
      .catch((databaseError: unknown) => {
        console.error("Không thể đóng kết nối MySQL:", databaseError);
        process.exit(1);
      });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
