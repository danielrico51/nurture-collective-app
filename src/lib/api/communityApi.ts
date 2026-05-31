import { isCommunityServiceConfigured } from "@/lib/community/config";

/** @deprecated Use isCommunityServiceConfigured — kept for older imports */
export const isCommunityApiConfigured = isCommunityServiceConfigured;

export interface CommunitySummary {
  community_id: string;
  organization_id: string;
  name: string;
  description: string;
  visibility: string;
  tags: string[];
  member_count?: number;
}

export interface CommunityListResponse {
  count: number;
  next: number | null;
  previous: number | null;
  results: CommunitySummary[];
}

export interface MyCommunity extends CommunitySummary {
  membership_id: string;
  role: string;
  joined_at: string;
}

export interface MyCommunitiesResponse {
  results: MyCommunity[];
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
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as T;
};

export const fetchCommunities = async (): Promise<CommunityListResponse> => {
  const response = await fetch("/api/community/communities", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<CommunityListResponse>(response);
};

export const fetchMyCommunities = async (): Promise<MyCommunitiesResponse> => {
  const response = await fetch("/api/community/communities/me", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<MyCommunitiesResponse>(response);
};

export const joinCommunity = async (communityId: string): Promise<void> => {
  const response = await fetch(
    `/api/community/communities/${encodeURIComponent(communityId)}/join`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({}),
    }
  );
  await handleResponse(response);
};

export const leaveCommunity = async (communityId: string): Promise<void> => {
  const response = await fetch(
    `/api/community/communities/${encodeURIComponent(communityId)}/leave`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({}),
    }
  );
  await handleResponse(response);
};
