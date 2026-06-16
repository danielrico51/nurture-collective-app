import type { ProposalLlmContent, ProposalMetadata } from "@/types/proposal";

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

export const fetchClientProposals = async (
  clientId: string
): Promise<{ proposals: ProposalMetadata[] }> => {
  const response = await fetch(
    `/api/proposals?client_id=${encodeURIComponent(clientId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<{ proposals: ProposalMetadata[] }>(response);
};

export const generateClientProposal = async (
  clientId: string
): Promise<{
  metadata: ProposalMetadata;
  content: ProposalLlmContent;
  google_doc_error?: string | null;
}> => {
  const response = await fetch("/api/proposals/generate", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ client_id: clientId }),
  });
  return handleResponse<{
    metadata: ProposalMetadata;
    content: ProposalLlmContent;
    google_doc_error?: string | null;
  }>(response);
};

export const approveClientProposal = async (
  clientId: string,
  proposalId: string
): Promise<{ metadata: ProposalMetadata }> => {
  const response = await fetch(`/api/proposals/${encodeURIComponent(proposalId)}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ client_id: clientId, action: "approve" }),
  });
  return handleResponse<{ metadata: ProposalMetadata }>(response);
};

export const reviseClientProposal = async (
  clientId: string,
  proposalId: string,
  feedback: string
): Promise<{ metadata: ProposalMetadata; content: ProposalLlmContent }> => {
  const response = await fetch(`/api/proposals/${encodeURIComponent(proposalId)}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ client_id: clientId, action: "revise", feedback }),
  });
  return handleResponse<{ metadata: ProposalMetadata; content: ProposalLlmContent }>(
    response
  );
};

export const sendClientProposalForSignature = async (
  clientId: string,
  proposalId: string,
  signerEmail: string
): Promise<{ metadata: ProposalMetadata }> => {
  const response = await fetch(
    `/api/proposals/${encodeURIComponent(proposalId)}/send-signature`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ client_id: clientId, signer_email: signerEmail }),
    }
  );
  return handleResponse<{ metadata: ProposalMetadata }>(response);
};
