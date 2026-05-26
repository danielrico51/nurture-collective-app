import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/authHelpers";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import { getActiveConversationForUser } from "@/lib/conversation/storage";
import { getIntakeForUser } from "@/lib/intake/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { user, error } = await requireAuthUser(request);
  if (error || !user) return error;

  if (params.id !== user.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [intake, conversation] = await Promise.all([
      getIntakeForUser(user.sub),
      getActiveConversationForUser(user.sub, user.email),
    ]);

    return NextResponse.json({
      userId: user.sub,
      intakeProfile: intake.profile,
      recommendations: intake.recommendations,
      extractedProfile: conversation?.extractedProfile ?? null,
      conversationSessionId: conversation?.id ?? null,
    });
  } catch (err) {
    return handleIntakeStorageError(err);
  }
}
