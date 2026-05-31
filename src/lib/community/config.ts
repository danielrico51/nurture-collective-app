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
