import { NextRequest, NextResponse } from "next/server";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { shouldSyncEventToCalendar } from "@/lib/events/calendar/times";
import { syncEventToGoogleCalendar } from "@/lib/events/calendar/sync";
import { getEventBySlug } from "@/lib/events/storage";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const event = await getEventBySlug(params.slug, { includeDrafts: true });
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await syncEventToGoogleCalendar(event);

    if (item.googleCalendarSyncError?.trim()) {
      return NextResponse.json(
        { error: item.googleCalendarSyncError, item },
        { status: 422 }
      );
    }

    if (shouldSyncEventToCalendar(event) && !item.googleCalendarEventId) {
      return NextResponse.json(
        {
          error:
            "Calendar sync did not create an event. Confirm the listing is published and calendar sync is enabled in Settings.",
          item,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
