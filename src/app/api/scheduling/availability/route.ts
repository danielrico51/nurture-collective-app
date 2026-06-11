import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserOrGuestForScheduling } from "@/lib/api/authHelpers";
import { isGoogleSchedulingActive } from "@/lib/scheduling/config";
import { listAvailableSlots } from "@/lib/scheduling/google/availability";
import { handleSchedulingError } from "@/lib/scheduling/handleSchedulingError";
import { SchedulingNotConfiguredError } from "@/lib/scheduling/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuthUserOrGuestForScheduling(request);
  if (auth.error) return auth.error;

  if (!isGoogleSchedulingActive()) {
    return NextResponse.json(
      { error: "Live scheduling is not enabled", configured: false },
      { status: 503 }
    );
  }

  try {
    const days = Number.parseInt(
      request.nextUrl.searchParams.get("days") ?? "",
      10
    );
    const availability = await listAvailableSlots({
      horizonDays: Number.isFinite(days) && days > 0 ? days : undefined,
    });
    return NextResponse.json(availability);
  } catch (error) {
    if (!isGoogleSchedulingActive()) {
      return handleSchedulingError(new SchedulingNotConfiguredError());
    }
    return handleSchedulingError(error);
  }
}
