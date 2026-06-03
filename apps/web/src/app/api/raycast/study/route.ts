import "server-only";

import { NextResponse } from "next/server";
import { getLocalStudyData } from "../../_utils/local-study";

export const GET = async (req: Request) => {
  try {
    return NextResponse.json(
      await getLocalStudyData(new URL(req.url).searchParams),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
};
