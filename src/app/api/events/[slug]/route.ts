import { NextRequest, NextResponse } from "next/server";
import { handleEventsStorageError } from "@/lib/api/routeHelpers";
import { getEventBySlug } from "@/lib/events/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const item = await getEventBySlug(params.slug);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
