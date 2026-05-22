import { userFactory } from "@minute/prisma/vitest/factories";
import { db } from "@minute/prisma/vitest/helpers";
import { it, describe, vi, expect } from "vitest";
import { getUserByApiToken } from "..";

vi.mock("server-only");

describe("getUserByApiToken", () => {
  describe("when a user with the given api token exists", () => {
    it("returns the user id", async () => {
      const user = await userFactory
        .props({ apiToken: () => "test-token-abc" })
        .create();
      await expect(
        getUserByApiToken(db)({ apiToken: "test-token-abc" }),
      ).resolves.toStrictEqual({ id: user.id });
    });
  });

  describe("when no user with the given api token exists", () => {
    it("returns null", async () => {
      await expect(
        getUserByApiToken(db)({ apiToken: "nonexistent-token" }),
      ).resolves.toBeNull();
    });
  });
});
