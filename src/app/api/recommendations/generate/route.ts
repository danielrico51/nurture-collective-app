import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/authHelpers";
import { handleIntakeStorageError } from "@/lib/api/routeHelpers";
import { extractedProfileToIntakeDraft } from "@/lib/conversation/profileMapper";
import { getActiveConversationForUser } from "@/lib/conversation/storage";
import { generateRecommendations } from "@/lib/intake/recommendations";
import {
  getIntakeForUser,
  submitProfile,
  upsertProfileDraft,
} from "@/lib/intake/storage";
import { createEmptyProfile, normalizeProfile } from "@/lib/intake/normalize";
import type { IntakeDraft } from "@/types/intake";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuthUser(request);
  if (error || !user) return error;

  let body: { userId?: string; submit?: boolean };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.userId && body.userId !== user.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [conversation, intake] = await Promise.all([
      getActiveConversationForUser(user.sub, user.email),
      getIntakeForUser(user.sub),
    ]);

    const baseProfile = intake.profile
      ? normalizeProfile(intake.profile)
      : createEmptyProfile(user.sub);

    const draft: IntakeDraft = conversation?.extractedProfile
      ? extractedProfileToIntakeDraft(conversation.extractedProfile)
      : {
          name: baseProfile.name,
          email: baseProfile.email,
          phone: baseProfile.phone,
          maternalStage: baseProfile.maternalStage,
          supportInterests: baseProfile.supportInterests,
          challenges: baseProfile.challenges,
          challengesFreeText: baseProfile.challengesFreeText,
          preferredSchedule: baseProfile.preferredSchedule,
          locationZip: baseProfile.locationZip,
          insuranceProvider: baseProfile.insuranceProvider,
          insuranceInterested: baseProfile.insuranceInterested,
          budgetPreference: baseProfile.budgetPreference,
        };

    if (
      body.submit &&
      draft.maternalStage &&
      draft.phone &&
      draft.name &&
      draft.supportInterests?.length
    ) {
      const result = await submitProfile(user.sub, {
        ...draft,
        maternalStage: draft.maternalStage,
        supportInterests: draft.supportInterests,
      });
      return NextResponse.json(result);
    }

    const saved = await upsertProfileDraft(user.sub, draft);
    const recommendations = generateRecommendations(saved);
    return NextResponse.json({ profile: saved, recommendations });
  } catch (err) {
    return handleIntakeStorageError(err);
  }
}
