import { NextRequest, NextResponse } from "next/server";
import { serverIntegrations } from "@/config/integrations";
import { isPublicIntakeEnabled } from "@/config/intakeAccess";
import { requireAuthUserOrGuest } from "@/lib/api/authHelpers";
import { isGuestSessionId } from "@/lib/auth/guestSession";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import {
  getIntakeForUser,
  submitProfile,
  upsertProfileDraft,
} from "@/lib/intake/storage";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { IntakeDraft, MaternalStage } from "@/types/intake";

export const dynamic = "force-dynamic";

const VALID_STAGES: MaternalStage[] = [
  "trying-to-conceive",
  "pregnant",
  "newly-postpartum",
  "infant-care",
  "toddler",
  "multiple-children",
];

const requireUser = async (request: NextRequest) => {
  if (isPublicIntakeEnabled()) {
    const { user, error, isGuest } = await requireAuthUserOrGuest(request);
    if (error || !user) return { error, user: null, isGuest: false };
    return { error: null, user, isGuest };
  }

  const user = await verifyRequest(request);
  if (!user?.sub) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      isGuest: false,
    };
  }
  return { error: null, user, isGuest: false };
};

const handleStorageError = handleIntakeStorageError;

export async function GET(request: NextRequest) {
  const { error, user } = await requireUser(request);
  if (error || !user) return error;

  try {
    const data = await getIntakeForUser(user.sub, user.email);
    return NextResponse.json(data);
  } catch (err) {
    return handleStorageError(err);
  }
}

export async function PATCH(request: NextRequest) {
  const { error, user } = await requireUser(request);
  if (error || !user) return error;

  let body: { draft?: IntakeDraft };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const draft = body.draft ?? {};
  if (!draft.email && user.email) {
    draft.email = user.email;
  }

  try {
    const profile = await upsertProfileDraft(user.sub, draft, user.email);
    const recommendations = (await getIntakeForUser(user.sub, user.email))
      .recommendations;
    return NextResponse.json({ profile, recommendations });
  } catch (err) {
    return handleStorageError(err);
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireUser(request);
  if (error || !user) return error;

  let body: { draft?: IntakeDraft };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const draft = body.draft ?? {};

  if (!draft.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!draft.phone?.trim()) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (!draft.maternalStage || !VALID_STAGES.includes(draft.maternalStage)) {
    return NextResponse.json(
      { error: "Please select where you are in your journey" },
      { status: 400 }
    );
  }
  if (!draft.supportInterests?.length) {
    return NextResponse.json(
      { error: "Please select at least one type of support" },
      { status: 400 }
    );
  }

  draft.email = draft.email?.trim() || user.email;

  try {
    const { profile, recommendations } = await submitProfile(
      user.sub,
      draft,
      user.email
    );

    try {
      await forwardToN8n(
        serverIntegrations.n8nInquiryWebhookUrl,
        serverIntegrations.n8nWebhookSecret,
        {
          source: "member-intake",
          audience: "mom",
          userId: user.sub,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          message: profile.challengesFreeText || "Intake completed via care journey flow",
          preferredContact: profile.smsConsent ? "whatsapp" : "email",
          maternalStage: profile.maternalStage,
          supportInterests: profile.supportInterests,
          challenges: profile.challenges,
          locationZip: profile.locationZip,
          submittedAt: profile.updatedAt,
          recommendations: recommendations.map((item) => ({
            type: item.recommendationType,
            reason: item.recommendationReason,
          })),
        }
      );
    } catch (webhookError) {
      console.error("[intake] n8n forward failed:", webhookError);
    }

    return NextResponse.json({ profile, recommendations });
  } catch (err) {
    return handleStorageError(err);
  }
}
