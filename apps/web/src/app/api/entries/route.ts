import "server-only";

import {
  createTimeEntry,
  getTimeEntries,
} from "@minute/services";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../config/db";
import { authenticateToken } from "../auth-token";

export const GET = async (request: Request) => {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const cursorStartedAt = searchParams.get("cursor[startedAt]");
  const cursorId = searchParams.get("cursor[id]");

  let cursor: { startedAt: Date; id: string } | undefined;
  if (cursorStartedAt !== null && cursorId !== null) {
    const parsed = z
      .strictObject({
        startedAt: z.string().datetime(),
        id: z.string().uuid(),
      })
      .safeParse({ startedAt: cursorStartedAt, id: cursorId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }
    cursor = { startedAt: new Date(parsed.data.startedAt), id: parsed.data.id };
  }

  const result = await getTimeEntries(db)({
    userId: auth.userId,
    cursor,
  });

  return NextResponse.json(result);
};

const createTimeEntrySchema = z.strictObject({
  startedAt: z.string().datetime(),
  stoppedAt: z.string().datetime(),
  description: z.string(),
  folderId: z.string().uuid(),
});

export const POST = async (request: Request) => {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const parsed = createTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  await createTimeEntry(db)({
    userId: auth.userId,
    startedAt: new Date(parsed.data.startedAt),
    stoppedAt: new Date(parsed.data.stoppedAt),
    description: parsed.data.description,
    folderId: parsed.data.folderId,
  });

  return NextResponse.json({ success: true }, { status: 201 });
};
