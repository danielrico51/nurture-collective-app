import type {
  AdminLeadsResponse,
  CoordinatorNoteType,
  CreateManualLeadInput,
  CorporateBenefitPlatform,
  ExpectedBabyGender,
  LeadDetailResponse,
  LeadRecord,
  LeadStatus,
} from "@/types/lead";

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

export const fetchAdminLeads = async (
  includeArchived = false
): Promise<AdminLeadsResponse> => {
  const params = includeArchived ? "?includeArchived=true" : "";
  const response = await fetch(`/api/admin/leads${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<AdminLeadsResponse>(response);
};

export const fetchAdminLeadDetail = async (
  leadId: string
): Promise<LeadDetailResponse> => {
  const response = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<LeadDetailResponse>(response);
};

export const addAdminLeadNote = async (
  leadId: string,
  body: string,
  type: CoordinatorNoteType = "general"
): Promise<{ note: LeadDetailResponse["notes"][number] }> => {
  const response = await fetch(
    `/api/admin/leads/${encodeURIComponent(leadId)}/notes`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ body, type }),
    }
  );
  return handleResponse(response);
};

export const createAdminLead = async (
  payload: CreateManualLeadInput
): Promise<{ lead: LeadRecord }> => {
  const response = await fetch("/api/admin/leads", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateAdminLead = async (
  leadId: string,
  payload: {
    status?: LeadStatus;
    coordinatorId?: string;
    archive?: boolean;
    restore?: boolean;
    name?: string;
    email?: string;
    phone?: string;
    locationZip?: string | null;
    maternalStage?: string | null;
    supportInterests?: string[];
    challengesSummary?: string;
    partnerName?: string | null;
    dueDate?: string | null;
    expectedBabyGender?: ExpectedBabyGender | null;
    hospitalName?: string | null;
    locationAddress?: string | null;
    feeQuotedCents?: number | null;
    feeQuotedAmount?: string;
    feeQuotedMaxCents?: number | null;
    feeQuotedMaxAmount?: string;
    feeQuotedNotes?: string | null;
    corporateBenefitPlatform?: CorporateBenefitPlatform | null;
    corporateBenefitNotes?: string | null;
  }
): Promise<{ lead: LeadRecord }> => {
  const response = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};
