import { userFactory } from "@minute/prisma/vitest/factories";
import { db } from "@minute/prisma/vitest/helpers";
import { it, describe, vi, expect } from "vitest";
import { getUserApiToken } from "..";

vi.mock("server-only");

describe("getUserApiToken", () => {
  describe("when the user has no api token", () => {
    it("returns null", async () => {
      const user = await userFactory.create();
      await expect(
        getUserApiToken(db)({ userId: user.id }),
      ).resolves.toBeNull();
    });
  });

  describe("when the user has an api token", () => {
    it("returns the token", async () => {
      const user = await userFactory
        .props({ apiToken: () => "my-api-token" })
        .create();
      await expect(
        getUserApiToken(db)({ userId: user.id }),
      ).resolves.toBe("my-api-token");
    });
  });
});
