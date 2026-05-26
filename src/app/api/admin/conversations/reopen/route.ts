import { NextRequest, NextResponse } from "next/server";
import {
  handleIntakeStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { reopenConversationForUser } from "@/lib/conversation/storage";
import { updateProfileStatus } from "@/lib/intake/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: {
    userId?: string;
    email?: string;
    sessionId?: string;
    resetIntakeToDraft?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const session = await reopenConversationForUser(
      userId,
      body.email,
      body.sessionId?.trim()
    );

    let profile = null;
    if (body.resetIntakeToDraft !== false) {
      try {
        profile = await updateProfileStatus(userId, "draft");
      } catch {
        /* member may not have an intake profile yet */
      }
    }

    return NextResponse.json({ session, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reopen failed";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return handleIntakeStorageError(error);
  }
}
