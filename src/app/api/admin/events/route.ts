import { NextRequest, NextResponse } from "next/server";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { createEvent, listAllEvents, seedEventsSamplesIfEmpty } from "@/lib/events/storage";
import type { CreateEventInput } from "@/types/event";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    if (request.nextUrl.searchParams.get("seed") === "true") {
      await seedEventsSamplesIfEmpty();
    }
    const items = await listAllEvents();
    return NextResponse.json({ items });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as CreateEventInput;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const item = await createEvent(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
