import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { getProposalsBucket, proposalsStorageConfig } from "@/lib/proposals/config";
import {
  buildClientRootPrefix,
  buildProposalApprovedKey,
  buildProposalAuditKey,
  buildProposalDraftKey,
  buildProposalMetadataKey,
  buildProposalSignedKey,
  buildProposalVersionKey,
  localProposalClientRoot,
  localProposalRoot,
} from "@/lib/proposals/paths";
import type {
  ProposalAuditEvent,
  ProposalLlmContent,
  ProposalMetadata,
  ProposalVersionRecord,
} from "@/types/proposal";

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const readJson = async <T>(bucket: string, key: string): Promise<T | null> => {
  try {
    const response = await getS3Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

const writeJson = async (
  bucket: string,
  key: string,
  payload: unknown
): Promise<void> => {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

const localPath = (clientId: string, proposalId: string, filename: string) =>
  path.join(localProposalRoot(clientId, proposalId), filename);

const readLocalJson = async <T>(
  clientId: string,
  proposalId: string,
  filename: string
): Promise<T | null> => {
  try {
    const raw = await fs.readFile(localPath(clientId, proposalId, filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeLocalJson = async (
  clientId: string,
  proposalId: string,
  filename: string,
  payload: unknown
): Promise<void> => {
  const filePath = localPath(clientId, proposalId, filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
};

const getClientsBucket = (): string => {
  const bucket = getProposalsBucket();
  if (!bucket && !proposalsStorageConfig.useLocalStorage) {
    throw new Error("NURTURE_CLIENTS_BUCKET is not configured");
  }
  return bucket;
};

export const readProposalMetadata = async (
  clientId: string,
  proposalId: string
): Promise<ProposalMetadata | null> => {
  if (proposalsStorageConfig.useLocalStorage) {
    return readLocalJson<ProposalMetadata>(clientId, proposalId, "metadata.json");
  }
  return readJson<ProposalMetadata>(
    getClientsBucket(),
    buildProposalMetadataKey(clientId, proposalId)
  );
};

export const writeProposalMetadata = async (
  metadata: ProposalMetadata
): Promise<void> => {
  if (proposalsStorageConfig.useLocalStorage) {
    await writeLocalJson(
      metadata.client_id,
      metadata.proposal_id,
      "metadata.json",
      metadata
    );
    return;
  }
  await writeJson(
    getClientsBucket(),
    buildProposalMetadataKey(metadata.client_id, metadata.proposal_id),
    metadata
  );
};

export const writeProposalDraft = async (
  clientId: string,
  proposalId: string,
  content: ProposalLlmContent
): Promise<void> => {
  if (proposalsStorageConfig.useLocalStorage) {
    await writeLocalJson(clientId, proposalId, "draft.json", content);
    return;
  }
  await writeJson(
    getClientsBucket(),
    buildProposalDraftKey(clientId, proposalId),
    content
  );
};

export const readProposalDraft = async (
  clientId: string,
  proposalId: string
): Promise<ProposalLlmContent | null> => {
  if (proposalsStorageConfig.useLocalStorage) {
    return readLocalJson<ProposalLlmContent>(clientId, proposalId, "draft.json");
  }
  return readJson<ProposalLlmContent>(
    getClientsBucket(),
    buildProposalDraftKey(clientId, proposalId)
  );
};

export const writeProposalVersion = async (
  clientId: string,
  proposalId: string,
  version: ProposalVersionRecord
): Promise<void> => {
  if (proposalsStorageConfig.useLocalStorage) {
    await writeLocalJson(
      clientId,
      proposalId,
      `versions/v${version.version}.json`,
      version
    );
    return;
  }
  await writeJson(
    getClientsBucket(),
    buildProposalVersionKey(clientId, proposalId, version.version),
    version
  );
};

export const writeProposalApproved = async (
  clientId: string,
  proposalId: string,
  content: ProposalLlmContent
): Promise<void> => {
  if (proposalsStorageConfig.useLocalStorage) {
    await writeLocalJson(clientId, proposalId, "approved.json", content);
    return;
  }
  await writeJson(
    getClientsBucket(),
    buildProposalApprovedKey(clientId, proposalId),
    content
  );
};

export const writeProposalSigned = async (
  clientId: string,
  proposalId: string,
  payload: Record<string, unknown>
): Promise<void> => {
  if (proposalsStorageConfig.useLocalStorage) {
    await writeLocalJson(clientId, proposalId, "signed.json", payload);
    return;
  }
  await writeJson(
    getClientsBucket(),
    buildProposalSignedKey(clientId, proposalId),
    payload
  );
};

export const appendProposalAuditEvent = async (
  event: ProposalAuditEvent
): Promise<void> => {
  if (proposalsStorageConfig.useLocalStorage) {
    const filename = `audit/${event.timestamp.replace(/[:.]/g, "-")}.json`;
    await writeLocalJson(event.client_id, event.proposal_id, filename, event);
    return;
  }
  await writeJson(
    getClientsBucket(),
    buildProposalAuditKey(event.client_id, event.proposal_id, new Date(event.timestamp)),
    event
  );
};

export const listProposalIdsForClient = async (
  clientId: string
): Promise<string[]> => {
  if (proposalsStorageConfig.useLocalStorage) {
    const root = localProposalClientRoot(clientId);
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  const bucket = getClientsBucket();
  const prefix = `${buildClientRootPrefix(clientId)}proposals/`;
  const ids = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of response.Contents ?? []) {
      const match = item.Key?.match(/proposal_id=([^/]+)\//);
      if (match?.[1]) ids.add(match[1]);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return Array.from(ids);
};
