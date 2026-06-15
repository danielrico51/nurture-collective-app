import { NextRequest, NextResponse } from "next/server";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listClassRegistrations } from "@/lib/classRegistrations/storage";
import { getClassAvailabilityForEvent } from "@/lib/classRegistrations/service";
import { getEventBySlug } from "@/lib/events/storage";

export const dynamic = "force-dynamic";

export async function GET(
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

    const [registrations, availability] = await Promise.all([
      listClassRegistrations(params.slug),
      getClassAvailabilityForEvent(event),
    ]);

    return NextResponse.json({ registrations, availability });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
