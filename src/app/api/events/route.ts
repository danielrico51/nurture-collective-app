import { NextResponse } from "next/server";
import { handleEventsStorageError } from "@/lib/api/routeHelpers";
import { toPublicEventItems } from "@/lib/events/publicEvent";
import { listPublishedEvents } from "@/lib/events/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = toPublicEventItems(await listPublishedEvents());
    return NextResponse.json({ items });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
