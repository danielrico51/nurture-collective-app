import { buildJourneyMetadata } from "@/lib/community/journeyStages";
import {
  CommunityServiceError,
  proxyCommunityRequest,
} from "@/lib/community/proxy";
import { getCommunityApiUrl } from "@/lib/community/config";
import type { JournalProfile } from "@/types/journal";

export const journalProfileToCommunityMetadata = (
  profile: JournalProfile
): Record<string, string | number> => {
  if (!profile.maternalStage) return {};
  return buildJourneyMetadata({
    stage: profile.maternalStage,
    journeyPath: profile.journeyPath ?? undefined,
    dueDate: profile.dueDate ?? undefined,
    postpartumWeeks:
      profile.postpartumWeeks != null
        ? String(profile.postpartumWeeks)
        : undefined,
    babyAgeWeeks:
      profile.postpartumWeeks != null
        ? String(profile.postpartumWeeks)
        : undefined,
  });
};

/** Push current journal journey snapshot to community-service (optional). */
export async function syncJournalToCommunity(
  authorizationHeader: string,
  profile: JournalProfile
): Promise<void> {
  if (!getCommunityApiUrl()) return;
  if (!profile.maternalStage) return;

  const metadata = journalProfileToCommunityMetadata(profile);
  if (Object.keys(metadata).length === 0) return;

  try {
    const patchResponse = await proxyCommunityRequest(
      authorizationHeader,
      "/api/v1/users/me/",
      {
        method: "PATCH",
        body: JSON.stringify({ profile_metadata: metadata }),
      }
    );
    if (!patchResponse.ok && patchResponse.status !== 503) {
      console.warn("[journal] community profile sync failed:", patchResponse.status);
      return;
    }

    await proxyCommunityRequest(authorizationHeader, "/api/v1/cohorts/assign/", {
      method: "POST",
      body: JSON.stringify({ force_refresh: false }),
    });
  } catch (error) {
    if (error instanceof CommunityServiceError) return;
    console.warn("[journal] community sync error:", error);
  }
}
