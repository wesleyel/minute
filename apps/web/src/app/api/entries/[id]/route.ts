import "server-only";

import {
  deleteTimeEntry,
  getTimeEntry,
  updateTimeEntry,
} from "@minute/services";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../config/db";
import { authenticateToken } from "../../auth-token";

type Params = { params: Promise<{ id: string }> };

export const GET = async (request: Request, { params }: Params) => {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const entry = await getTimeEntry(db)({ id, userId: auth.userId });
  if (entry === null) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(entry);
};

export const PUT = async (request: Request, { params }: Params) => {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const updateSchema = z.strictObject({
    startedAt: z.string().datetime().optional(),
    stoppedAt: z.string().datetime().optional(),
    description: z.string().optional(),
    folderId: z.string().uuid().optional(),
  });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    await updateTimeEntry(db)({
      id,
      userId: auth.userId,
      startedAt:
        parsed.data.startedAt !== undefined
          ? new Date(parsed.data.startedAt)
          : undefined,
      stoppedAt:
        parsed.data.stoppedAt !== undefined
          ? new Date(parsed.data.stoppedAt)
          : undefined,
      description: parsed.data.description,
      folderId: parsed.data.folderId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "The timeEntry does not exist.") {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
};

export const DELETE = async (request: Request, { params }: Params) => {
  const auth = await authenticateToken(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  try {
    await deleteTimeEntry(db)({
      id,
      userId: auth.userId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "The timeEntry does not exist.") {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
};
