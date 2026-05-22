import { userFactory } from "@minute/prisma/vitest/factories";
import { db } from "@minute/prisma/vitest/helpers";
import { TRPCError } from "@trpc/server";
import { it, describe, vi, expect } from "vitest";
import { createInnerContext } from "../context";
import { createCaller } from ".";

vi.mock("server-only");

describe("currentUserRouter", () => {
  describe("#getCurrentUser", () => {
    describe("when a user is not logged in", () => {
      it("throws an error", async () => {
        const caller = createCaller(
          createInnerContext({ db, currentUserId: undefined }),
        );
        await expect(caller.currentUser.getCurrentUser()).rejects.toThrow(
          new TRPCError({ code: "UNAUTHORIZED" }),
        );
      });
    });

    describe("when a user is logged in", () => {
      it("returns the current user", async () => {
        const user = await userFactory.create();
        await userFactory.create();
        await userFactory.create();
        const caller = createCaller(
          createInnerContext({ db, currentUserId: user.id }),
        );
        await expect(
          caller.currentUser.getCurrentUser(),
        ).resolves.toStrictEqual({
          id: user.id,
          image: user.image,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    });
  });

  describe("#getApiToken", () => {
    describe("when a user is not logged in", () => {
      it("throws an error", async () => {
        const caller = createCaller(
          createInnerContext({ db, currentUserId: undefined }),
        );
        await expect(caller.currentUser.getApiToken()).rejects.toThrow(
          new TRPCError({ code: "UNAUTHORIZED" }),
        );
      });
    });

    describe("when a user has no api token", () => {
      it("returns null", async () => {
        const user = await userFactory.create();
        const caller = createCaller(
          createInnerContext({ db, currentUserId: user.id }),
        );
        await expect(caller.currentUser.getApiToken()).resolves.toBeNull();
      });
    });

    describe("when a user has an api token", () => {
      it("returns the token", async () => {
        const user = await userFactory
          .props({ apiToken: () => "my-test-token" })
          .create();
        const caller = createCaller(
          createInnerContext({ db, currentUserId: user.id }),
        );
        await expect(caller.currentUser.getApiToken()).resolves.toBe(
          "my-test-token",
        );
      });
    });
  });

  describe("#regenerateApiToken", () => {
    describe("when a user is not logged in", () => {
      it("throws an error", async () => {
        const caller = createCaller(
          createInnerContext({ db, currentUserId: undefined }),
        );
        await expect(caller.currentUser.regenerateApiToken()).rejects.toThrow(
          new TRPCError({ code: "UNAUTHORIZED" }),
        );
      });
    });

    describe("when a user is logged in", () => {
      it("returns a new api token", async () => {
        const user = await userFactory.create();
        const caller = createCaller(
          createInnerContext({ db, currentUserId: user.id }),
        );
        const token = await caller.currentUser.regenerateApiToken();
        expect(typeof token).toBe("string");
        expect(token.length).toBeGreaterThan(0);
      });
    });
  });
});
