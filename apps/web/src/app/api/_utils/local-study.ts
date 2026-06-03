import "server-only";

import {
  differenceInSeconds,
  endOfDay,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { z } from "zod";
import { db } from "../../../../config/db";
import { getLocalTimerUserId } from "./local-timer";

const dateOnlyRegexp = /^\d{4}-\d{2}-\d{2}$/;

const studyDataQuerySchema = z.strictObject({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
});

const parseQueryDate = (value: string, boundary: "start" | "end") => {
  const parsed = parseISO(value);

  if (!isValid(parsed)) {
    throw new Error(`${boundary}Date must be a valid ISO date.`);
  }

  if (!dateOnlyRegexp.test(value)) {
    return parsed;
  }

  return boundary === "start" ? startOfDay(parsed) : endOfDay(parsed);
};

const getDurationInRange = ({
  startedAt,
  stoppedAt,
  startDate,
  endDate,
}: {
  startedAt: Date;
  stoppedAt: Date;
  startDate: Date;
  endDate: Date;
}) => {
  return Math.max(
    0,
    differenceInSeconds(
      new Date(Math.min(stoppedAt.getTime(), endDate.getTime())),
      new Date(Math.max(startedAt.getTime(), startDate.getTime())),
    ),
  );
};

export const getLocalStudyData = async (searchParams: URLSearchParams) => {
  const query = studyDataQuerySchema.parse({
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  });
  
  const startDate = query.startDate ? parseQueryDate(query.startDate, "start") : undefined;
  const endDate = query.endDate ? parseQueryDate(query.endDate, "end") : undefined;

  if (startDate && endDate && isBefore(endDate, startDate)) {
    throw new Error("The startDate must be earlier than endDate.");
  }

  const userId = await getLocalTimerUserId();
  
  const whereConditions: any = {
    task: {
      userId,
      folder: {
        userId,
      },
    },
  };
  
  if (startDate && endDate) {
    whereConditions.startedAt = { lte: endDate };
    whereConditions.stoppedAt = { gte: startDate };
  } else if (startDate) {
    whereConditions.stoppedAt = { gte: startDate };
  } else if (endDate) {
    whereConditions.startedAt = { lte: endDate };
  }
  
  const timeEntries = await db.timeEntry.findMany({
    where: whereConditions,
    include: {
      task: {
        include: {
          folder: true,
        },
      },
    },
    orderBy: [{ startedAt: "asc" }, { id: "asc" }],
  });
  
  const items = timeEntries.map((timeEntry) => ({
    ...timeEntry,
    durationInRange: startDate && endDate
      ? getDurationInRange({
          startedAt: timeEntry.startedAt,
          stoppedAt: timeEntry.stoppedAt,
          startDate,
          endDate,
        })
      : differenceInSeconds(timeEntry.stoppedAt, timeEntry.startedAt),
  }));

  return {
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    totalDuration: items.reduce(
      (total, item) => total + item.durationInRange,
      0,
    ),
    items,
  };
};
