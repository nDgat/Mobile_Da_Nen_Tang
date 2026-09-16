import mysql, { type RowDataPacket } from "mysql2/promise";

import { env } from "../config/env.js";

interface DatabaseInfoRow extends RowDataPacket {
  databaseName: string;
  version: string;
}

export const databasePool = mysql.createPool({
  connectionLimit: 10,
  database: env.database.name,
  enableKeepAlive: true,
  host: env.database.host,
  password: env.database.password,
  port: env.database.port,
  queueLimit: 0,
  user: env.database.user,
  waitForConnections: true,
});

export async function checkDatabaseConnection(): Promise<{
  name: string;
  version: string;
}> {
  const [rows] = await databasePool.query<DatabaseInfoRow[]>(
    "SELECT DATABASE() AS databaseName, VERSION() AS version",
  );
  const databaseInfo = rows[0];

  if (!databaseInfo) {
    throw new Error("MySQL không trả về thông tin database.");
  }

  return {
    name: databaseInfo.databaseName,
    version: databaseInfo.version,
  };
}

export async function closeDatabaseConnection(): Promise<void> {
  await databasePool.end();
}
