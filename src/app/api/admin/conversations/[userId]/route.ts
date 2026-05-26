import { NextRequest, NextResponse } from "next/server";
import {
  handleIntakeStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listConversationSessionsForUser } from "@/lib/conversation/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { userId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  const email = request.nextUrl.searchParams.get("email");

  try {
    const sessions = await listConversationSessionsForUser(
      params.userId,
      email
    );
    const sorted = sessions.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({
      sessions: sorted.map((session) => ({
        id: session.id,
        status: session.status,
        messageCount: session.messages.length,
        completionScore: session.extractedProfile.completionScore,
        readyToComplete: session.extractedProfile.readyToComplete,
        updatedAt: session.updatedAt,
        createdAt: session.createdAt,
      })),
    });
  } catch (error) {
    return handleIntakeStorageError(error);
  }
}
