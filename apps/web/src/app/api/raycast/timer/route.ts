import "server-only";

import { NextResponse } from "next/server";
import {
  getLocalRaycastFolders,
  getLocalRaycastRecentDescriptions,
} from "../../_utils/local-raycast";
import {
  getLocalTimerStatus,
  raycastTimerRequestSchema,
  startLocalTimer,
  stopLocalTimer,
  updateLocalTimer,
} from "../../_utils/local-timer";

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const status = await getLocalTimerStatus();

    if (url.searchParams.get("include") !== "meta") {
      return NextResponse.json(status);
    }

    const limitParam = url.searchParams.get("limit");
    const limit =
      limitParam === null ? 20 : Math.min(Math.max(Number(limitParam), 1), 50);

    return NextResponse.json({
      ...status,
      folders: await getLocalRaycastFolders(),
      recentDescriptions: await getLocalRaycastRecentDescriptions(limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const input = raycastTimerRequestSchema.parse(await req.json());
    const status = await getLocalTimerStatus();

    if (input.action === "start") {
      if (status.isRunning) {
        await updateLocalTimer(input);
      } else {
        await startLocalTimer(input);
      }
    }

    if (input.action === "stop") {
      if (status.isRunning) {
        await stopLocalTimer();
      }
    }

    if (input.action === "toggle") {
      if (status.isRunning) {
        await stopLocalTimer();
      } else {
        await startLocalTimer(input);
      }
    }

    return NextResponse.json(await getLocalTimerStatus());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
};
