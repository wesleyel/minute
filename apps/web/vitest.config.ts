import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    exclude: [...configDefaults.exclude, "e2e"],
    coverage: {
      include: ["config/next-auth.ts", "src/middleware.ts"],
    },
    server: {
      deps: {
        // https://next-intl.dev/docs/environments/testing#vitest
        inline: ["next-intl"],
      },
    },
  },
});
