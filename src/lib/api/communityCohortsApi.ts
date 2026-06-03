import { parseCommunityApiError } from "@/lib/api/communityApiError";
import { fetchCommunityWithRetry } from "@/lib/api/communityFetch";

export interface CohortSummary {
  cohort_id: string;
  cohort_type: string;
  name: string;
  description: string;
  window_start: string | null;
  window_end: string | null;
  linked_community_id: string | null;
  is_active: boolean;
}

export interface CohortMembershipSummary {
  membership_id: string;
  cohort_id: string;
  cohort_type: string;
  name: string;
  source: string;
  assigned_at: string;
  linked_community_id: string | null;
}

export interface CohortRecommendation {
  cohort_id: string;
  cohort_type: string;
  name: string;
  description: string;
  linked_community_id: string | null;
  score: number;
  reason: string;
}

export interface CohortAssignResult {
  cohort_id: string;
  cohort_type: string;
  name: string;
  source: string;
  linked_community_id: string | null;
}

const authHeaders = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseCommunityApiError(data, response.status));
  }
  return data as T;
};

export const fetchMyCohorts = async (): Promise<{
  results: CohortMembershipSummary[];
}> => {
  const response = await fetchCommunityWithRetry("/api/community/cohorts/me", {
    headers: await authHeaders(),
  });
  return handleResponse(response);
};

export const fetchCohortRecommendations = async (): Promise<{
  recommendations: CohortRecommendation[];
}> => {
  const response = await fetchCommunityWithRetry(
    "/api/community/cohorts/recommendations",
    { headers: await authHeaders() }
  );
  return handleResponse(response);
};

export const joinCohort = async (
  cohortId: string
): Promise<CohortAssignResult> => {
  const response = await fetchCommunityWithRetry(
    `/api/community/cohorts/${encodeURIComponent(cohortId)}/join`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({}),
    }
  );
  return handleResponse(response);
};

export const assignCohorts = async (
  forceRefresh = false
): Promise<{ assigned: CohortAssignResult[] }> => {
  const response = await fetchCommunityWithRetry("/api/community/cohorts/assign", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ force_refresh: forceRefresh }),
  });
  return handleResponse(response);
};
