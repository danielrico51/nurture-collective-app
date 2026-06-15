import { NextRequest, NextResponse } from "next/server";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import {
  deleteClassCalendarEvent,
  syncEventToGoogleCalendar,
} from "@/lib/events/calendar/sync";
import { deleteEvent, getEventBySlug, updateEvent } from "@/lib/events/storage";
import type { UpdateEventInput } from "@/types/event";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const item = await getEventBySlug(params.slug, { includeDrafts: true });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as UpdateEventInput;
    const item = await updateEvent(params.slug, body);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const synced = await syncEventToGoogleCalendar(item);
      return NextResponse.json({ item: synced });
    } catch (syncError) {
      console.error("[events] calendar sync after update failed:", syncError);
      return NextResponse.json({ item });
    }
  } catch (error) {
    return handleEventsStorageError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const item = await getEventBySlug(params.slug, { includeDrafts: true });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteClassCalendarEvent(item);
    const removed = await deleteEvent(params.slug);
    if (!removed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
