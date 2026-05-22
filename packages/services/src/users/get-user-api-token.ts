import "server-only";

import type { PrismaClient } from "@minute/prisma";
import { contract } from "@minute/utils";
import { z } from "zod";

export const getUserApiToken = (db: PrismaClient) =>
  contract(
    {
      input: z.strictObject({
        userId: z.string().uuid(),
      }),
      output: z.promise(z.string().nullable()),
    },
    async (input) => {
      const user = await db.user.findFirst({
        select: { apiToken: true },
        where: { id: input.userId },
      });
      return user?.apiToken ?? null;
    },
  );
