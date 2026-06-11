import { NextResponse } from "next/server";
import {
  SchedulingNotConfiguredError,
  SchedulingSlotUnavailableError,
} from "@/lib/scheduling/errors";
import { serverSchedulingConfig } from "@/lib/scheduling/config";

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
    const delegatedUser = serverSchedulingConfig.delegatedUser;
    return NextResponse.json(
      {
        error:
          `Google Calendar access is not authorized yet for ${delegatedUser}. ` +
          "Use GOOGLE_CALENDAR_DELEGATED_USER=admin@nesting-place.com (not info@ — the intro calendar lives under admin). " +
          "In Google Workspace Admin, authorize domain-wide delegation for nurture-tasks-sync with scope https://www.googleapis.com/auth/calendar, " +
          "then refresh Amplify ADC with: ./infrastructure/aws/scripts/set-amplify-google-calendar-env.sh and redeploy.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: `Scheduling failed: ${message}` }, { status: 500 });
};
