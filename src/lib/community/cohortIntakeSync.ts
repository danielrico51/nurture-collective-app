import type { IntakeProfile } from "@/types/intake";
import {
  CommunityServiceError,
  proxyCommunityRequest,
} from "@/lib/community/proxy";
import { getCommunityApiUrl } from "@/lib/community/config";

/** Map member intake fields to community-service profile_metadata for cohort rules. */
export function intakeToCohortMetadata(
  profile: Pick<
    IntakeProfile,
    | "maternalStage"
    | "dueDate"
    | "postpartumWeeks"
    | "postpartumMonths"
    | "locationZip"
  >
): Record<string, string | number> {
  const meta: Record<string, string | number> = {};

  if (profile.dueDate) {
    const d = profile.dueDate.slice(0, 10);
    meta.due_date = d;
    meta.estimated_due_date = d;
  }
  if (profile.postpartumWeeks != null) {
    meta.postpartum_weeks = profile.postpartumWeeks;
  }
  if (profile.postpartumMonths != null) {
    meta.postpartum_months = profile.postpartumMonths;
  }
  if (profile.maternalStage) {
    meta.maternal_stage = profile.maternalStage;
  }
  if (profile.locationZip?.trim()) {
    meta.location_zip = profile.locationZip.trim();
  }

  if (
    profile.maternalStage === "newly-postpartum" &&
    meta.postpartum_weeks == null
  ) {
    meta.postpartum_weeks = 2;
  }
  if (
    (profile.maternalStage === "newly-postpartum" ||
      profile.maternalStage === "infant-care") &&
    meta.newborn_age_days == null
  ) {
    meta.newborn_age_days = 14;
  }

  return meta;
}

/**
 * After intake submit: sync metadata to community-service and run auto-assign.
 * No-op when COMMUNITY_API_URL is unset or cohorts API returns 503.
 */
export async function syncCohortsAfterIntake(
  authorizationHeader: string,
  profile: IntakeProfile
): Promise<void> {
  if (!getCommunityApiUrl()) return;

  const metadata = intakeToCohortMetadata(profile);
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
      console.warn(
        "[cohorts] profile metadata sync failed:",
        patchResponse.status
      );
      return;
    }

    const assignResponse = await proxyCommunityRequest(
      authorizationHeader,
      "/api/v1/cohorts/assign/",
      {
        method: "POST",
        body: JSON.stringify({ force_refresh: false }),
      }
    );
    if (assignResponse.status === 503) return;
    if (!assignResponse.ok) {
      console.warn("[cohorts] auto-assign failed:", assignResponse.status);
    }
  } catch (error) {
    if (error instanceof CommunityServiceError) return;
    console.warn("[cohorts] intake sync error:", error);
  }
}
