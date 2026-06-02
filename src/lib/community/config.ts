export const getCommunityApiUrl = (): string | undefined => {
  const explicit =
    process.env.COMMUNITY_API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_COMMUNITY_API_URL?.replace(/\/$/, "");

  if (explicit) return explicit;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8001";
  }

  return undefined;
};

export const isCommunityServiceConfigured = (): boolean =>
  Boolean(getCommunityApiUrl());

export const isCommunityDemoFallbackEnabled = (): boolean =>
  process.env.COMMUNITY_DEMO_FALLBACK !== "false";

/** WebSocket base for browser clients (use public URL in production). */
export const getCommunityWsBaseUrl = (): string | undefined => {
  const httpUrl =
    process.env.NEXT_PUBLIC_COMMUNITY_API_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8001" : undefined);

  if (!httpUrl) return undefined;
  return httpUrl.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");
};
