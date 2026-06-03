import { getCommunityApiUrl, getCommunityEnvScope } from "@/lib/community/config";

export class CommunityServiceError extends Error {
  constructor(
    message: string,
    readonly status = 503
  ) {
    super(message);
    this.name = "CommunityServiceError";
  }
}

/**
 * Forwards the member's Cognito ID token to community-service (validated again server-side).
 * Local dev may still use JWT_DEV_BYPASS + `Bearer dev:role:sub` when bypass is enabled there.
 */
export const proxyCommunityRequest = async (
  authorizationHeader: string,
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
  headers.set("Authorization", authorizationHeader);
  headers.set("X-Community-Env-Scope", getCommunityEnvScope());
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
