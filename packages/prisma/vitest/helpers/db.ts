import { createPrismaClient } from "../../src/create-prisma-client";

const databaseUrl = process.env["DATABASE_URL"];
if (databaseUrl === undefined) {
  throw new Error("DATABASE_URL is not set.");
}

export const db = createPrismaClient(databaseUrl);
