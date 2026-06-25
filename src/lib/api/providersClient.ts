import type {
  AdminProvidersResponse,
  CreateProviderInput,
  ProviderRecord,
  ProviderRole,
  ProviderStatus,
  UpdateProviderInput,
} from "@/types/provider";
import type {
  AdminProviderEngagementsResponse,
  ReallocateProviderEngagementInput,
  ReallocateProviderEngagementResponse,
} from "@/types/serviceEngagement";
import type { AdminProviderStatsResponse } from "@/types/provider";

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

export const fetchAdminProviders = async (
  includeArchived = false
): Promise<AdminProvidersResponse> => {
  const params = includeArchived ? "?includeArchived=true" : "";
  const response = await fetch(`/api/admin/providers${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<AdminProvidersResponse>(response);
};

export const fetchAdminProvider = async (
  providerId: string
): Promise<{ provider: ProviderRecord }> => {
  const response = await fetch(
    `/api/admin/providers/${encodeURIComponent(providerId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse(response);
};

export const createAdminProvider = async (
  payload: CreateProviderInput
): Promise<{ provider: ProviderRecord }> => {
  const response = await fetch("/api/admin/providers", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateAdminProvider = async (
  providerId: string,
  payload: UpdateProviderInput
): Promise<{ provider: ProviderRecord }> => {
  const response = await fetch(
    `/api/admin/providers/${encodeURIComponent(providerId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const PROVIDER_ROLE_LABELS: Record<ProviderRole, string> = {
  postpartum_doula: "Postpartum doula",
  birth_doula: "Birth doula",
  backup: "Backup / coverage",
  educator: "Educator",
  other: "Other",
};

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

export const fetchProviderStats = async (
  year?: number
): Promise<AdminProviderStatsResponse> => {
  const params =
    year !== undefined ? `?year=${encodeURIComponent(String(year))}` : "";
  const response = await fetch(`/api/admin/providers/stats${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse(response);
};

export const fetchProviderEngagements = async (
  providerId: string
): Promise<AdminProviderEngagementsResponse> => {
  const response = await fetch(
    `/api/admin/providers/${encodeURIComponent(providerId)}/engagements`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse(response);
};

export const reallocateProviderEngagement = async (
  providerId: string,
  payload: ReallocateProviderEngagementInput
): Promise<ReallocateProviderEngagementResponse> => {
  const response = await fetch(
    `/api/admin/providers/${encodeURIComponent(providerId)}/reallocate`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};
