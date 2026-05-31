import { canAccessAdminApps } from "@/lib/auth/groups";
import type { AuthUser } from "@/lib/auth/verifyRequest";
import { getCommunityApiUrl } from "@/lib/community/config";

export class CommunityServiceError extends Error {
  constructor(
    message: string,
    readonly status = 503
  ) {
    super(message);
    this.name = "CommunityServiceError";
  }
}

const buildServiceAuthHeader = (user: AuthUser): string => {
  const role = canAccessAdminApps(user.groups) ? "admin" : "parent";
  return `Bearer dev:${role}:${user.sub}`;
};

export const proxyCommunityRequest = async (
  user: AuthUser,
  path: string,
  init: RequestInit = {}
): Promise<Response> => {
  const baseUrl = getCommunityApiUrl();
  if (!baseUrl) {
    throw new CommunityServiceError(
      "Community service is not configured. Set COMMUNITY_API_URL in environment variables.",
      503
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", buildServiceAuthHeader(user));
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
};

export const readCommunityJson = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};
