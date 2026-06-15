import "server-only";

import { NextResponse } from "next/server";
import { getLocalRaycastRecentDescriptions } from "../../_utils/local-raycast";

export const GET = async (req: Request) => {
  try {
    const limitParam = new URL(req.url).searchParams.get("limit");
    const limit =
      limitParam === null ? 20 : Math.min(Math.max(Number(limitParam), 1), 50);

    return NextResponse.json(await getLocalRaycastRecentDescriptions(limit));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
};
