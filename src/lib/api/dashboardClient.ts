import { fetchWithRetry } from "@/lib/api/fetchWithRetry";
import type { DashboardAnalyticsResponse } from "@/types/dashboard";

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
    const message =
      typeof data.error === "string"
        ? data.error
        : text.slice(0, 200) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
};

export const fetchDashboardAnalytics = async (
  year?: number
): Promise<DashboardAnalyticsResponse> => {
  const params = year ? `?year=${year}` : "";
  const response = await fetchWithRetry(`/api/admin/dashboard/analytics${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<DashboardAnalyticsResponse>(response);
};
