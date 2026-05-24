import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listTeamMembers } from "@/lib/tasks/members";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const members = await listTeamMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Team members error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load team members";

    if (message.includes("NEXT_PUBLIC_USER_POOL_ID")) {
      return NextResponse.json(
        { error: "Cognito user pool is not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not load team members from Cognito" },
      { status: 500 }
    );
  }
}
