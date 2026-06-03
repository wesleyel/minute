import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string().startsWith("file:"),
    NEXTAUTH_URL: z.string().url().startsWith("http"),
    NEXTAUTH_SECRET: z.string(),
    ALLOWED_IPS: z.string().optional(),
    OBS_RAYCAST_USER_ID: z.string().uuid().optional(),
    ALLOWED_GITHUB_IDS: z
      .string()
      .regex(/^[0-9,]+$/)
      .optional(),
    GITHUB_ID: z.string(),
    GITHUB_SECRET: z.string(),
    ORIGIN: z.string(),
  },
  experimental__runtimeEnv: {},
  skipValidation: process.env["SKIP_ENV_VALIDATION"] === "true",
  emptyStringAsUndefined: true,
});
