import "server-only";

import type { PrismaClient } from "@minute/prisma";
import { contract } from "@minute/utils";
import { z } from "zod";

export const getUserByApiToken = (db: PrismaClient) =>
  contract(
    {
      input: z.strictObject({
        apiToken: z.string(),
      }),
      output: z.promise(
        z
          .strictObject({
            id: z.string().uuid(),
          })
          .nullable(),
      ),
    },
    async (input) => {
      const user = await db.user.findFirst({
        select: {
          id: true,
        },
        where: {
          apiToken: input.apiToken,
        },
      });
      return user;
    },
  );
