import { NextResponse } from "next/server";
import {
  SchedulingNotConfiguredError,
  SchedulingSlotUnavailableError,
} from "@/lib/scheduling/errors";

export const handleSchedulingError = (error: unknown) => {
  if (error instanceof SchedulingNotConfiguredError) {
    return NextResponse.json(
      { error: error.message, configured: false },
      { status: 503 }
    );
  }

  if (error instanceof SchedulingSlotUnavailableError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  const message = error instanceof Error ? error.message : "Scheduling failed";
  console.error("[scheduling]", error);

  if (
    message.includes("invalid_grant") ||
    message.includes("unauthorized_client") ||
    message.includes("Not Authorized")
  ) {
    return NextResponse.json(
      {
        error:
          "Google Calendar scheduling credentials need to be refreshed or granted calendar access for the delegated account.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: `Scheduling failed: ${message}` }, { status: 500 });
};
