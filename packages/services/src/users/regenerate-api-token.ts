import "server-only";

import type { PrismaClient } from "@minute/prisma";
import { contract } from "@minute/utils";
import { z } from "zod";

export const regenerateApiToken = (db: PrismaClient) =>
  contract(
    {
      input: z.strictObject({
        userId: z.string().uuid(),
      }),
      output: z.promise(z.string()),
    },
    async (input) => {
      const apiToken = crypto.randomUUID();
      await db.user.update({
        data: {
          apiToken,
        },
        where: {
          id: input.userId,
        },
      });
      return apiToken;
    },
  );
