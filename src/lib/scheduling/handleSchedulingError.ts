import { NextResponse } from "next/server";
import {
  SchedulingNotConfiguredError,
  SchedulingSlotUnavailableError,
} from "@/lib/scheduling/errors";
import { buildSchedulingAuthErrorMessage } from "@/lib/scheduling/calendarDeployGuards";
import { serverSchedulingConfig } from "@/lib/scheduling/config";

const isGoogleAuthFailure = (message: string): boolean => {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid_grant") ||
    lower.includes("invalid_rapt") ||
    lower.includes("unauthorized_client") ||
    lower.includes("unauthorized to retrieve access tokens") ||
    lower.includes("not authorized for any of the scopes") ||
    lower.includes("domain-wide delegation") ||
    lower.includes("not authorized")
  );
};

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

  if (isGoogleAuthFailure(message)) {
    return NextResponse.json(
      {
        error: buildSchedulingAuthErrorMessage(
          serverSchedulingConfig.delegatedUser,
          message
        ),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: `Scheduling failed: ${message}` }, { status: 500 });
};
