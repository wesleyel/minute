import "server-only";

import type { PrismaClient } from "@minute/prisma";
import { taskSchema } from "@minute/schemas";
import { contract } from "@minute/utils";
import { z } from "zod";

export const getSuggestionTasks = (db: PrismaClient) =>
  contract(
    {
      input: z.strictObject({
        userId: z.string().uuid(),
        description: z.string(),
      }),
      output: z.promise(z.array(taskSchema)),
    },
    async (input) => {
      return z.array(taskSchema).parse(
        await db.$queryRaw`
          SELECT Task.*
          FROM Task
            INNER JOIN Folder ON Task.folderId = Folder.id
          WHERE
            Task.userId = ${input.userId}
            AND Folder.userId = ${input.userId}
            AND instr(Task.description, ${input.description}) > 0
          LIMIT 20
        `,
      );
    },
  );
