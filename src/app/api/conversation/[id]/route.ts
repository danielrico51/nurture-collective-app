import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserOrGuest } from "@/lib/api/authHelpers";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import { reactivateConversationIfIncomplete } from "@/lib/conversation/sessionLifecycle";
import { getConversationSession } from "@/lib/conversation/storage";
import { findConfirmedBookingForConversation } from "@/lib/scheduling/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { user, error } = await requireAuthUserOrGuest(request);
  if (error || !user) return error;

  try {
    let session = await getConversationSession(user.sub, params.id, user.email);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    session = await reactivateConversationIfIncomplete(session);
    const confirmedBooking = await findConfirmedBookingForConversation(
      user.sub,
      session.id
    );
    return NextResponse.json({ session, confirmedBooking });
  } catch (err) {
    return handleIntakeStorageError(err);
  }
}
