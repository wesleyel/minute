import "server-only";

import { NextResponse } from "next/server";
import {
  getLocalTimerStatus,
  raycastTimerRequestSchema,
  startLocalTimer,
  stopLocalTimer,
  updateLocalTimer,
} from "../../_utils/local-timer";

export const GET = async () => {
  try {
    return NextResponse.json(await getLocalTimerStatus());
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
