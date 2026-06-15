import { NextRequest, NextResponse } from "next/server";
import { getClassAvailabilityForEvent } from "@/lib/classRegistrations/service";
import { getEventBySlug } from "@/lib/events/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await getEventBySlug(params.slug);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const availability = await getClassAvailabilityForEvent(event);
    return NextResponse.json({ availability, priceCents: event.priceCents ?? 0 });
  } catch (error) {
    console.error("[events] availability error:", error);
    return NextResponse.json(
      { error: "Could not load availability" },
      { status: 500 }
    );
  }
}
