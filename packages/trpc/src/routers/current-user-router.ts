import "server-only";

import { userSchema } from "@minute/schemas";
import { getUser, getUserApiToken, regenerateApiToken } from "@minute/services";
import { z } from "zod";
import { protectedProcedure } from "../procedures";
import { router } from "../trpc";

export const currentUserRouter = router({
  getCurrentUser: protectedProcedure
    .output(userSchema)
    .query(async ({ ctx }) => {
      return await getUser(ctx.db)({
        userId: ctx.currentUserId,
      });
    }),

  getApiToken: protectedProcedure
    .output(z.string().nullable())
    .query(async ({ ctx }) => {
      return await getUserApiToken(ctx.db)({
        userId: ctx.currentUserId,
      });
    }),

  regenerateApiToken: protectedProcedure
    .output(z.string())
    .mutation(async ({ ctx }) => {
      return await regenerateApiToken(ctx.db)({
        userId: ctx.currentUserId,
      });
    }),
});
