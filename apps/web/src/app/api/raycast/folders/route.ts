import "server-only";

import { NextResponse } from "next/server";
import { getLocalRaycastFolders } from "../../_utils/local-raycast";

export const GET = async () => {
  try {
    return NextResponse.json(await getLocalRaycastFolders());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
};
