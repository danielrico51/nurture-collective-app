import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/authHelpers";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import { getConversationSession } from "@/lib/conversation/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { user, error } = await requireAuthUser(request);
  if (error || !user) return error;

  try {
    const session = await getConversationSession(user.sub, params.id, user.email);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    return handleIntakeStorageError(err);
  }
}
