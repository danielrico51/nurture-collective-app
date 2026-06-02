import { parseCommunityApiError } from "@/lib/api/communityApiError";
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

export interface CommunityMembershipDetail {
  membership_id: string;
  community_id: string;
  user_id: string;
  organization_id: string;
  role: string;
  joined_at: string;
}

export interface CommunityDetail extends CommunitySummary {
  created_at: string;
  updated_at: string;
  my_membership: CommunityMembershipDetail | null;
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

export interface CreateCommunityInput {
  name: string;
  description?: string;
  visibility?: "public" | "private" | "invite_only";
  tags?: string[];
}

export const createCommunity = async (
  input: CreateCommunityInput
): Promise<CommunitySummary> => {
  const response = await fetch("/api/community/communities", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? "",
      visibility: input.visibility ?? "public",
      tags: input.tags ?? [],
    }),
  });
  return handleResponse<CommunitySummary>(response);
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

export const fetchCommunityDetail = async (
  communityId: string
): Promise<CommunityDetail> => {
  const response = await fetch(
    `/api/community/communities/${encodeURIComponent(communityId)}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  return handleResponse<CommunityDetail>(response);
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
