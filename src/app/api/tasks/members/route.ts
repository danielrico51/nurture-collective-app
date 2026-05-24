import { NextRequest, NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import {
  formatCognitoListError,
  listTeamMembers,
  teamMemberFromAuthUser,
} from "@/lib/tasks/members";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const members = await listTeamMembers();
    const current = teamMemberFromAuthUser(auth.user!);
    const hasCurrent = members.some((m) => m.id === current.id);

    return NextResponse.json({
      members: hasCurrent ? members : [current, ...members],
    });
  } catch (error) {
    console.error("Team members error:", error);
    const formatted = formatCognitoListError(error);
    const message =
      error instanceof Error ? error.message : "Failed to load team members";

    if (message.includes("NEXT_PUBLIC_USER_POOL_ID")) {
      return NextResponse.json(
        { error: "Cognito user pool is not configured" },
        { status: 503 }
      );
    }

    if (auth.user) {
      return NextResponse.json({
        members: [teamMemberFromAuthUser(auth.user)],
        partial: true,
        message: formatted.userMessage,
        debug: {
          errorName: formatted.name,
          errorDetail: formatted.detail,
          ...formatted.hint,
        },
      });
    }

    return NextResponse.json(
      { error: "Could not load team members from Cognito" },
      { status: 500 }
    );
  }
}
