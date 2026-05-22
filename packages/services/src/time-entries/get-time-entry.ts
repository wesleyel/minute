import "server-only";

import type { PrismaClient } from "@minute/prisma";
import { folderSchema, taskSchema, timeEntrySchema } from "@minute/schemas";
import { contract } from "@minute/utils";
import { z } from "zod";

export const getTimeEntry = (db: PrismaClient) =>
  contract(
    {
      input: z.strictObject({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      output: z.promise(
        timeEntrySchema
          .extend({
            task: taskSchema.extend({
              folder: folderSchema,
            }),
          })
          .nullable(),
      ),
    },
    async (input) => {
      return await db.timeEntry.findFirst({
        where: {
          id: input.id,
          task: {
            userId: input.userId,
            folder: {
              userId: input.userId,
            },
          },
        },
        include: {
          task: {
            include: {
              folder: true,
            },
          },
        },
      });
    },
  );
