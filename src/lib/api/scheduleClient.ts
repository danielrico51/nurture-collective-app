import type {
  CreateProviderPayoutBatchInput,
  CreateScheduleShiftInput,
  CreateScheduleShiftsFromLabelInput,
  CreateServiceEngagementInput,
  ClientEngagementsResponse,
  ProviderPayoutReportResponse,
  ProviderPayoutReportRow,
  ServiceEngagementWithDetails,
  UpdateEngagementPackageInput,
  UpdatePaymentExpectationInput,
  UpdateProviderPayoutBatchInput,
  UpdateScheduleShiftInput,
  UpdateServiceEngagementInput,
} from "@/types/serviceEngagement";
import {
  ENGAGEMENT_SERVICE_TYPES,
  ENGAGEMENT_STATUSES,
  type EngagementServiceType,
  type EngagementStatus,
} from "@/types/serviceEngagement";

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

export const fetchClientEngagements = async (
  clientId: string
): Promise<ClientEngagementsResponse> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse(response);
};

export const fetchClientEngagement = async (
  clientId: string,
  engagementId: string
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse(response);
};

export const createClientEngagement = async (
  clientId: string,
  payload: CreateServiceEngagementInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateClientEngagement = async (
  clientId: string,
  engagementId: string,
  payload: UpdateServiceEngagementInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const deleteClientEngagement = async (
  clientId: string,
  engagementId: string
): Promise<{ ok: true }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}`,
    {
      method: "DELETE",
      headers: await authHeaders(),
    }
  );
  return handleResponse(response);
};

export const updateEngagementPackage = async (
  clientId: string,
  engagementId: string,
  packageId: string,
  payload: UpdateEngagementPackageInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/packages/${encodeURIComponent(packageId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updatePaymentExpectation = async (
  clientId: string,
  engagementId: string,
  expectationId: string,
  payload: UpdatePaymentExpectationInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/expectations/${encodeURIComponent(expectationId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const reissueExpectationInvoice = async (
  clientId: string,
  engagementId: string,
  expectationId: string
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/expectations/${encodeURIComponent(expectationId)}/reissue-invoice`,
    {
      method: "POST",
      headers: await authHeaders(),
    }
  );
  return handleResponse(response);
};

export const createEngagementShift = async (
  clientId: string,
  engagementId: string,
  payload: CreateScheduleShiftInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/shifts`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const createEngagementShiftsFromLabel = async (
  clientId: string,
  engagementId: string,
  payload: CreateScheduleShiftsFromLabelInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/shifts`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateEngagementShift = async (
  clientId: string,
  engagementId: string,
  shiftId: string,
  payload: UpdateScheduleShiftInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/shifts/${encodeURIComponent(shiftId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const createEngagementPayout = async (
  clientId: string,
  engagementId: string,
  payload: CreateProviderPayoutBatchInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/payouts`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateEngagementPayout = async (
  clientId: string,
  engagementId: string,
  payoutBatchId: string,
  payload: UpdateProviderPayoutBatchInput
): Promise<{ engagement: ServiceEngagementWithDetails }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/engagements/${encodeURIComponent(engagementId)}/payouts/${encodeURIComponent(payoutBatchId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const fetchProviderPayoutReport = async (options?: {
  providerId?: string;
  status?: "pending" | "paid" | "all";
  from?: string;
  to?: string;
}): Promise<ProviderPayoutReportResponse> => {
  const params = new URLSearchParams();
  if (options?.providerId) params.set("providerId", options.providerId);
  if (options?.status) params.set("status", options.status);
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/admin/schedule/payouts${query}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse(response);
};

export const ENGAGEMENT_SERVICE_TYPE_LABELS: Record<EngagementServiceType, string> = {
  postpartum: "Postpartum",
  birth: "Birth",
  other: "Other",
};

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  booked: "Booked",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export { ENGAGEMENT_SERVICE_TYPES, ENGAGEMENT_STATUSES };

export const formatEngagementMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export const parseDollarsToCents = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
};

export const formatCentsToDollars = (cents: number | null | undefined): string => {
  if (cents == null || cents === 0) return "";
  return String(cents / 100);
};
