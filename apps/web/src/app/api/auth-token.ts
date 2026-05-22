import "server-only";

import { getUserByApiToken } from "@minute/services";
import { NextResponse } from "next/server";
import { db } from "../../../config/db";

export const authenticateToken = async (
  request: Request,
): Promise<{ userId: string } | NextResponse> => {
  const authHeader = request.headers.get("Authorization");
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);
  const user = await getUserByApiToken(db)({ apiToken: token });
  if (user === null) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  return { userId: user.id };
};
