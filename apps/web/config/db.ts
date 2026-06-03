import "server-only";

import { createPrismaClient } from "@minute/prisma/create-client";
import { serverEnv } from "../env/server.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db =
  globalForPrisma.prisma ?? createPrismaClient(serverEnv.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
