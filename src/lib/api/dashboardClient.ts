import { fetchWithRetry } from "@/lib/api/fetchWithRetry";
import type {
  DashboardEngagementAnalytics,
  DashboardEngagementAnalyticsCore,
  DashboardEngagementRowsResult,
  DashboardLeadAnalytics,
  DashboardSnapshot,
} from "@/types/dashboard";

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
  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    const trimmed = text.trim();
    const isHtmlError =
      trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
    const message =
      typeof data.error === "string"
        ? data.error
        : isHtmlError
          ? `Server error (${response.status}). The request may have timed out — try refreshing.`
          : trimmed.slice(0, 200) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
};

export const fetchDashboardLeads = async (
  refresh = false
): Promise<{
  analytics: DashboardLeadAnalytics;
  storage: { leads: string };
}> => {
  const params = new URLSearchParams();
  if (refresh) params.set("refresh", "true");
  const query = params.toString();
  const response = await fetchWithRetry(
    `/api/admin/dashboard/leads${query ? `?${query}` : ""}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  return handleResponse(response);
};

export const fetchDashboardSnapshot = async (
  refresh = false,
  live = false
): Promise<{
  snapshot: DashboardSnapshot;
  storage: { clients: string };
}> => {
  const params = new URLSearchParams();
  if (refresh) params.set("refresh", "true");
  if (live) params.set("live", "true");
  const query = params.toString();
  const response = await fetchWithRetry(
    `/api/admin/dashboard/snapshot${query ? `?${query}` : ""}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  return handleResponse(response);
};

export const fetchDashboardEngagements = async (
  year?: number,
  refresh = false
): Promise<{
  analytics: DashboardEngagementAnalytics;
  storage: { clients: string };
}> => {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (refresh) params.set("refresh", "true");
  const query = params.toString();
  const response = await fetchWithRetry(
    `/api/admin/dashboard/engagements${query ? `?${query}` : ""}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  return handleResponse(response);
};

export const fetchDashboardEngagementRows = async (
  refresh = false
): Promise<
  DashboardEngagementRowsResult & {
    storage: { clients: string };
  }
> => {
  const params = new URLSearchParams();
  if (refresh) params.set("refresh", "true");
  const query = params.toString();
  const response = await fetchWithRetry(
    `/api/admin/dashboard/engagement-rows${query ? `?${query}` : ""}`,
    {
      headers: await authHeaders(),
      cache: "no-store",
    }
  );
  return handleResponse(response);
};
