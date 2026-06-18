import { sanitizeClientSegment } from "@/lib/clients/paths";
import type { ProposalMetadata } from "@/types/proposal";

/** Extract the (sanitized) client id segment from a proposal S3 key. */
export const parseProposalClientId = (key: string): string | null => {
  const match = key.match(/^clients\/client_id=([^/]+)\//);
  return match?.[1] ?? null;
};

/** Extract the proposal id from a proposal S3 key, when present. */
export const parseProposalIdFromKey = (key: string): string | null => {
  const match = key.match(/proposal_id=([^/]+)\//);
  return match?.[1] ?? null;
};

/**
 * Rewrite a proposal storage key so it lives under a new client id.
 * Only the `client_id=<old>/` segment is replaced; the rest is preserved.
 */
export const rewriteProposalKeyForClient = (
  key: string,
  oldClientSegment: string,
  newClientId: string
): string => {
  const newSegment = sanitizeClientSegment(newClientId);
  return key.replace(
    `clients/client_id=${oldClientSegment}/`,
    `clients/client_id=${newSegment}/`
  );
};

/**
 * Rewrite a proposal's metadata to point at the new client id while keeping
 * the original lead linkage. `lead_id` falls back to the previous client id
 * (which was the lead id under the old model).
 */
export const rewriteProposalMetadataForClient = (
  metadata: ProposalMetadata,
  newClientId: string
): ProposalMetadata => ({
  ...metadata,
  client_id: newClientId,
  lead_id: metadata.lead_id || metadata.client_id,
});
