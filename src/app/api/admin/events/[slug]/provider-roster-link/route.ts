import { NextRequest, NextResponse } from "next/server";
import {
  buildProviderRosterPath,
  buildProviderRosterUrl,
  createProviderRosterToken,
  resolveProviderRosterExpiry,
} from "@/lib/classRegistrations/providerAccess";
import {
  handleEventsStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
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

    const instructorEmail = event.instructorEmail?.trim();
    if (!instructorEmail) {
      return NextResponse.json(
        { error: "Instructor email is required to generate a roster link." },
        { status: 400 }
      );
    }

    const token = createProviderRosterToken(event);
    if (!token) {
      return NextResponse.json(
        { error: "Could not generate provider roster link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: buildProviderRosterUrl(event),
      path: buildProviderRosterPath(token),
      instructorEmail,
      expiresAt: resolveProviderRosterExpiry(event),
    });
  } catch (error) {
    return handleEventsStorageError(error);
  }
}
