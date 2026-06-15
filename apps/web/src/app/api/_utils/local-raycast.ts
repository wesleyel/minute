import "server-only";

import { db } from "../../../../config/db";
import { getLocalTimerUserId } from "./local-timer";

export const getLocalRaycastFolders = async () => {
  const userId = await getLocalTimerUserId();

  return db.folder.findMany({
    select: { id: true, name: true, emoji: true, color: true },
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
};

export const getLocalRaycastRecentDescriptions = async (limit = 20) => {
  const userId = await getLocalTimerUserId();

  const timeEntries = await db.timeEntry.findMany({
    select: {
      startedAt: true,
      task: {
        select: {
          description: true,
          folder: {
            select: { id: true, name: true, emoji: true, color: true },
          },
        },
      },
    },
    where: {
      task: { userId },
    },
    orderBy: { startedAt: "desc" },
    take: Math.min(limit * 5, 100),
  });

  const seen = new Set<string>();
  const items: {
    description: string;
    folder: {
      id: string;
      name: string;
      emoji: string;
      color: string;
    };
    lastUsedAt: string;
  }[] = [];

  for (const entry of timeEntries) {
    const description = entry.task.description;
    if (seen.has(description)) {
      continue;
    }
    seen.add(description);
    items.push({
      description,
      folder: entry.task.folder,
      lastUsedAt: entry.startedAt.toISOString(),
    });
    if (items.length >= limit) {
      break;
    }
  }

  return items;
};
