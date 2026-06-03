import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const parseSqliteDatabaseUrl = (databaseUrl: string) => {
  const [sqliteUrl = databaseUrl, queryString = ""] = databaseUrl.split("?", 2);
  const socketTimeoutSeconds = Number(
    new URLSearchParams(queryString).get("socket_timeout") ?? "30",
  );
  return {
    sqliteUrl,
    timeoutMs: socketTimeoutSeconds * 1000,
  };
};

export const createPrismaClient = (databaseUrl: string) => {
  const { sqliteUrl, timeoutMs } = parseSqliteDatabaseUrl(databaseUrl);
  const adapter = new PrismaBetterSqlite3(
    { url: sqliteUrl, timeout: timeoutMs },
  );
  return new PrismaClient({ adapter });
};
