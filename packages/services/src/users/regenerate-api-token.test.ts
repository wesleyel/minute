import { userFactory } from "@minute/prisma/vitest/factories";
import { db } from "@minute/prisma/vitest/helpers";
import { it, describe, vi, expect } from "vitest";
import { regenerateApiToken } from "..";

vi.mock("server-only");

describe("regenerateApiToken", () => {
  describe("when the user exists", () => {
    it("returns a new api token and updates the user", async () => {
      const user = await userFactory.create();
      const token = await regenerateApiToken(db)({ userId: user.id });
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      const updatedUser = await db.user.findFirst({
        select: { apiToken: true },
        where: { id: user.id },
      });
      expect(updatedUser?.apiToken).toBe(token);
    });

    it("generates a different token on each call", async () => {
      const user = await userFactory.create();
      const token1 = await regenerateApiToken(db)({ userId: user.id });
      const token2 = await regenerateApiToken(db)({ userId: user.id });
      expect(token1).not.toBe(token2);
    });
  });
});
