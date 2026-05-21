import "server-only";

import { NextResponse } from "next/server";
import { getLocalTimerStatus } from "../../_utils/local-timer";

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
