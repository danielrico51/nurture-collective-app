import { NextRequest, NextResponse } from "next/server";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
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
    return NextResponse.json({ item });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
