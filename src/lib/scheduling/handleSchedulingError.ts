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

  const lower = message.toLowerCase();
  if (
    lower.includes("invalid_grant") ||
    lower.includes("unauthorized_client") ||
    lower.includes("unauthorized to retrieve access tokens") ||
    lower.includes("not authorized for any of the scopes") ||
    lower.includes("domain-wide delegation") ||
    lower.includes("not authorized")
  ) {
    return NextResponse.json(
      {
        error:
          "Google Calendar access is not authorized yet. In Google Workspace Admin, authorize domain-wide delegation for the nurture-tasks-sync service account with the Calendar scope (https://www.googleapis.com/auth/calendar), then redeploy.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: `Scheduling failed: ${message}` }, { status: 500 });
};
