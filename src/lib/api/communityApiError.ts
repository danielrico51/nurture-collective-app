export const parseCommunityApiError = (
  data: unknown,
  status: number
): string => {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (status === 401) {
    return "Session expired or invalid. Sign in again.";
  }
  if (status === 403) {
    return "You do not have permission for this action.";
  }
  if (status === 404) {
    return "Not found. Restart the Next.js dev server if you recently added community API routes.";
  }
  if (status === 503) {
    return "The community service is temporarily unavailable. Please try again in a moment.";
  }
  if (status >= 500) {
    return "The community service hit a temporary error. Please try again in a moment.";
  }

  return `Request failed (${status})`;
};

export const isCommunityConnectionError = (message: string): boolean => {
  const lower = message.toLowerCase();
  return (
    lower.includes("not reachable") ||
    lower.includes("not configured") ||
    lower.includes("fetch failed") ||
    lower.includes("request failed (503)")
  );
};
