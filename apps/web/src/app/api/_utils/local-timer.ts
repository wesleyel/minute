import "server-only";

import {
  createRunningTimeEntry,
  getRunningTimeEntry,
  getTimeEntrySummary,
  stopRunningTimeEntry,
  updateRunningTimeEntry,
} from "@minute/services";
import { differenceInSeconds, endOfDay, startOfDay } from "date-fns";
import { z } from "zod";
import { db } from "../../../../config/db";
import { serverEnv } from "../../../../env/server.mjs";

const timerActionSchema = z.enum(["start", "stop", "toggle", "status"]);

export const raycastTimerRequestSchema = z.strictObject({
  action: timerActionSchema.default("toggle"),
  description: z.string().min(1).max(100).optional(),
  folderId: z.string().uuid().optional(),
  folder: z.string().min(1).optional(),
});

export const getLocalTimerUserId = async () => {
  if (serverEnv.OBS_RAYCAST_USER_ID !== undefined) {
    return serverEnv.OBS_RAYCAST_USER_ID;
  }

  const user = await db.user.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (user === null) {
    throw new Error("No user found for local timer API.");
  }

  return user.id;
};

const findDefaultFolder = async (userId: string) => {
  const result = await db.folder.findFirst({
    select: { id: true, name: true, emoji: true, color: true },
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (result === null) {
    throw new Error("No folder found. Create a folder before starting timer.");
  }

  return result;
};

const getFolder = async ({
  userId,
  folderId,
  folder,
}: {
  userId: string;
  folderId?: string | undefined;
  folder?: string | undefined;
}) => {
  const where =
    folderId !== undefined
      ? { id: folderId, userId }
      : folder !== undefined
        ? { name: folder, userId }
        : { userId };

  const result = await db.folder.findFirst({
    select: { id: true, name: true, emoji: true, color: true },
    where,
    orderBy: { createdAt: "asc" },
  });

  if (result !== null) {
    return result;
  }

  return await findDefaultFolder(userId);
};

export const getLocalTimerStatus = async () => {
  const userId = await getLocalTimerUserId();
  const runningTimeEntry = await getRunningTimeEntry(db)({ userId });
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const todaySummary = await getTimeEntrySummary(db)({
    userId,
    startDate: todayStart,
    endDate: todayEnd,
  });
  const folder =
    runningTimeEntry === null
      ? null
      : await db.folder.findFirst({
          select: { id: true, name: true, emoji: true, color: true },
          where: {
            id: runningTimeEntry.folderId,
            userId,
          },
        });
  const savedTodayDuration =
    runningTimeEntry === null
      ? 0
      : Number(
          todaySummary.find(
            ({ folderId }) => folderId === runningTimeEntry.folderId,
          )?.duration ?? 0n,
        );
  const savedTodayTotalDuration = todaySummary.reduce(
    (total, { duration }) => total + Number(duration),
    0,
  );
  const activeTodayDuration =
    runningTimeEntry === null
      ? 0
      : Math.max(
          0,
          differenceInSeconds(
            now,
            runningTimeEntry.startedAt >= todayStart
              ? runningTimeEntry.startedAt
              : todayStart,
          ),
        );
  const currentDuration =
    runningTimeEntry === null
      ? 0
      : Math.max(0, differenceInSeconds(now, runningTimeEntry.startedAt));

  return {
    isRunning: runningTimeEntry !== null,
    currentDuration,
    activeTodayDuration,
    todayProjectDuration: savedTodayDuration + activeTodayDuration,
    todayTotalDuration: savedTodayTotalDuration + activeTodayDuration,
    runningTimeEntry,
    folder,
  };
};

export const startLocalTimer = async ({
  description = "Raycast timer",
  folderId,
  folder,
}: {
  description?: string | undefined;
  folderId?: string | undefined;
  folder?: string | undefined;
}) => {
  const userId = await getLocalTimerUserId();
  const targetFolder = await getFolder({ userId, folderId, folder });

  await createRunningTimeEntry(db)({
    userId,
    folderId: targetFolder.id,
    description,
    startedAt: new Date(),
  });
};

export const stopLocalTimer = async () => {
  await stopRunningTimeEntry(db)({
    userId: await getLocalTimerUserId(),
    stoppedAt: new Date(),
  });
};

export const updateLocalTimer = async ({
  description,
  folderId,
  folder,
}: {
  description?: string | undefined;
  folderId?: string | undefined;
  folder?: string | undefined;
}) => {
  const userId = await getLocalTimerUserId();
  const targetFolder =
    folderId !== undefined || folder !== undefined
      ? await getFolder({ userId, folderId, folder })
      : undefined;

  await updateRunningTimeEntry(db)({
    userId,
    folderId: targetFolder?.id,
    description,
  });
};
