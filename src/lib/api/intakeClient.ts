import { intakeRequestHeaders } from "@/lib/api/intakeRequestHeaders";
import type {
  CareRecommendation,
  IntakeApiResponse,
  IntakeDraft,
  IntakeProfile,
  IntakeStatus,
} from "@/types/intake";

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed"
    );
  }
  return data as T;
};

export interface AdminIntakesResponse {
  profiles: IntakeProfile[];
  recommendations: CareRecommendation[];
}

export const fetchIntake = async (): Promise<IntakeApiResponse> => {
  const response = await fetch("/api/intake", {
    headers: await intakeRequestHeaders(),
    cache: "no-store",
  });
  return handleResponse<IntakeApiResponse>(response);
};

export const saveIntakeDraft = async (
  draft: IntakeDraft
): Promise<IntakeApiResponse> => {
  const response = await fetch("/api/intake", {
    method: "PATCH",
    headers: await intakeRequestHeaders(),
    body: JSON.stringify({ draft }),
  });
  return handleResponse<IntakeApiResponse>(response);
};

export const submitIntake = async (
  draft: IntakeDraft
): Promise<IntakeApiResponse> => {
  const response = await fetch("/api/intake", {
    method: "POST",
    headers: await intakeRequestHeaders(),
    body: JSON.stringify({ draft }),
  });
  return handleResponse<IntakeApiResponse>(response);
};

export const fetchAdminIntakes = async (): Promise<AdminIntakesResponse> => {
  const response = await fetch("/api/admin/intakes", {
    headers: await intakeRequestHeaders(),
    cache: "no-store",
  });
  return handleResponse<AdminIntakesResponse>(response);
};

export const updateAdminIntakeStatus = async (
  profileId: string,
  intakeStatus: IntakeStatus
): Promise<{ profile: IntakeProfile }> => {
  const response = await fetch(`/api/admin/intakes/${profileId}`, {
    method: "PATCH",
    headers: await intakeRequestHeaders(),
    body: JSON.stringify({ intakeStatus }),
  });
  return handleResponse<{ profile: IntakeProfile }>(response);
};

export interface AdminConversationSummary {
  id: string;
  status: "active" | "completed";
  messageCount: number;
  completionScore: number;
  readyToComplete: boolean;
  updatedAt: string;
  createdAt: string;
}

export const fetchAdminConversations = async (
  userId: string,
  email?: string
): Promise<{ sessions: AdminConversationSummary[] }> => {
  const params = email ? `?email=${encodeURIComponent(email)}` : "";
  const response = await fetch(`/api/admin/conversations/${userId}${params}`, {
    headers: await intakeRequestHeaders(),
    cache: "no-store",
  });
  return handleResponse<{ sessions: AdminConversationSummary[] }>(response);
};

export const reopenAdminConversation = async (payload: {
  userId: string;
  email?: string;
  sessionId?: string;
  resetIntakeToDraft?: boolean;
}): Promise<{
  session: { id: string; status: string; updatedAt: string };
  profile: IntakeProfile | null;
}> => {
  const response = await fetch("/api/admin/conversations/reopen", {
    method: "POST",
    headers: await intakeRequestHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};
