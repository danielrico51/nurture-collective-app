import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserOrGuest } from "@/lib/api/authHelpers";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import {
  getServiceTitleFromSlug,
  getSupportInterestFromServiceSlug,
} from "@/config/carePaths";
import { resumeOrCreateSession } from "@/lib/conversation/engine";
import { getConversationSession } from "@/lib/conversation/storage";
import { createEmptyExtractedProfile } from "@/types/conversation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuthUserOrGuest(request);
  if (error || !user) return error;

  let body: {
    email?: string;
    name?: string;
    phone?: string;
    forceNew?: boolean;
    serviceSlug?: string;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const serviceSlug = body.serviceSlug?.trim();
    const supportInterest = serviceSlug
      ? getSupportInterestFromServiceSlug(serviceSlug)
      : null;
    const preselectedService =
      serviceSlug && supportInterest
        ? {
            title: getServiceTitleFromSlug(serviceSlug),
            supportInterest,
          }
        : undefined;

    const session = await resumeOrCreateSession(
      user.sub,
      {
        ...createEmptyExtractedProfile(),
        email: body.email ?? user.email,
        name: body.name ?? user.name ?? "",
        phone: body.phone ?? "",
        ...(supportInterest ? { supportInterests: [supportInterest] } : {}),
      },
      {
        forceNew: body.forceNew === true || Boolean(preselectedService),
        preselectedService,
      }
    );

    const welcome = session.messages.find((message) => message.role === "assistant");
    return NextResponse.json({
      session,
      message: welcome ?? session.messages[0],
      quickReplies: session.quickReplies,
    });
  } catch (err) {
    return handleIntakeStorageError(err);
  }
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuthUserOrGuest(request);
  if (error || !user) return error;

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const session = await getConversationSession(user.sub, sessionId, user.email);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    return handleIntakeStorageError(err);
  }
}
