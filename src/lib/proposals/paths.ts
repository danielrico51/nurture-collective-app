import path from "path";
import { proposalsStorageConfig } from "@/lib/proposals/config";

const sanitizeSegment = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-z0-9._@-]+/g, "_").slice(0, 128);
};

export const eventDatetimePartition = (date = new Date()): string => {
  const stamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `event_datetime=${stamp}Z`;
};

export const buildClientRootPrefix = (clientId: string): string =>
  `clients/client_id=${sanitizeSegment(clientId)}/`;

export const buildProposalRootPrefix = (
  clientId: string,
  proposalId: string
): string =>
  `${buildClientRootPrefix(clientId)}proposals/proposal_id=${sanitizeSegment(proposalId)}/`;

export const buildProposalMetadataKey = (
  clientId: string,
  proposalId: string
): string => `${buildProposalRootPrefix(clientId, proposalId)}metadata.json`;

export const buildProposalDraftKey = (
  clientId: string,
  proposalId: string
): string => `${buildProposalRootPrefix(clientId, proposalId)}draft.json`;

export const buildProposalApprovedKey = (
  clientId: string,
  proposalId: string
): string => `${buildProposalRootPrefix(clientId, proposalId)}approved.json`;

export const buildProposalSignedKey = (
  clientId: string,
  proposalId: string
): string => `${buildProposalRootPrefix(clientId, proposalId)}signed.json`;

export const buildProposalVersionKey = (
  clientId: string,
  proposalId: string,
  version: number
): string =>
  `${buildProposalRootPrefix(clientId, proposalId)}versions/v${version}.json`;

export const buildProposalArtifactKey = (
  clientId: string,
  proposalId: string,
  filename: string
): string =>
  `${buildProposalRootPrefix(clientId, proposalId)}artifacts/${filename}`;

export const buildProposalAuditKey = (
  clientId: string,
  proposalId: string,
  date = new Date()
): string =>
  `${buildProposalRootPrefix(clientId, proposalId)}audit/${eventDatetimePartition(date)}/event.json`;

export const buildProposalLibraryPrefix = (serviceType: string): string =>
  `${proposalsStorageConfig.libraryPrefix}${sanitizeSegment(serviceType)}/`;

export const buildProposalLibraryProposalKey = (serviceType: string): string =>
  `${buildProposalLibraryPrefix(serviceType)}proposal.json`;

export const buildProposalLibraryTagsKey = (serviceType: string): string =>
  `${buildProposalLibraryPrefix(serviceType)}tags.json`;

export const localProposalDataRoot = (): string =>
  path.join(".data", "proposals", proposalsStorageConfig.deploymentEnvironment);

export const localProposalClientRoot = (clientId: string): string =>
  path.join(localProposalDataRoot(), "clients", sanitizeSegment(clientId));

export const localProposalRoot = (clientId: string, proposalId: string): string =>
  path.join(
    localProposalClientRoot(clientId),
    sanitizeSegment(proposalId)
  );
