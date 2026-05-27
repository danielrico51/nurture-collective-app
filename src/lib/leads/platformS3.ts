import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import {
  buildLeadArtifactKey,
  buildLeadListPrefix,
  buildLeadRootPrefix,
  LEAD_NOTE_FILENAME,
  LEAD_PROFILE_FILENAME,
  parseLeadIdFromKey,
} from "@/lib/leads/paths";
import type { CoordinatorNote, LeadRecord } from "@/types/lead";

const getClient = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

export const getLeadsBucket = (): string =>
  process.env.NURTURE_LEADS_BUCKET?.trim() ?? "";

export const readLeadsJson = async <T>(key: string): Promise<T | null> => {
  const Bucket = getLeadsBucket();
  if (!Bucket) return null;
  try {
    const response = await getClient().send(
      new GetObjectCommand({ Bucket, Key: key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
};

export const writeLeadsJson = async (key: string, payload: unknown): Promise<void> => {
  const Bucket = getLeadsBucket();
  if (!Bucket) throw new Error("NURTURE_LEADS_BUCKET is not configured");
  await getClient().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

export const listLeadsKeys = async (prefix = buildLeadListPrefix()): Promise<string[]> => {
  const Bucket = getLeadsBucket();
  if (!Bucket) return [];
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of response.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
  return keys;
};

export const listS3LeadIds = async (): Promise<string[]> => {
  const keys = await listLeadsKeys();
  const ids = new Set<string>();
  for (const key of keys) {
    const id = parseLeadIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

export const appendS3LeadProfile = async (lead: LeadRecord): Promise<string> => {
  const key = buildLeadArtifactKey(lead.leadId, "profile", LEAD_PROFILE_FILENAME);
  await writeLeadsJson(key, { ...lead, storageKey: key });
  return key;
};

export const appendS3CoordinatorNote = async (
  note: CoordinatorNote
): Promise<string> => {
  const key = buildLeadArtifactKey(note.leadId, "coordinator_notes", LEAD_NOTE_FILENAME);
  await writeLeadsJson(key, { ...note, storageKey: key });
  return key;
};

export const getLatestS3LeadProfile = async (
  leadId: string
): Promise<LeadRecord | null> => {
  const prefix = `${buildLeadRootPrefix(leadId)}profile/`;
  const keys = (await listLeadsKeys(prefix))
    .filter((key) => key.endsWith(`/${LEAD_PROFILE_FILENAME}`))
    .sort()
    .reverse();
  for (const key of keys) {
    const record = await readLeadsJson<LeadRecord>(key);
    if (record) return { ...record, storageKey: key };
  }
  return null;
};

export const listS3NotesForLead = async (leadId: string): Promise<CoordinatorNote[]> => {
  const prefix = `${buildLeadRootPrefix(leadId)}coordinator_notes/`;
  const keys = (await listLeadsKeys(prefix))
    .filter((key) => key.endsWith(`/${LEAD_NOTE_FILENAME}`))
    .sort()
    .reverse();
  const notes: CoordinatorNote[] = [];
  for (const key of keys) {
    const note = await readLeadsJson<CoordinatorNote>(key);
    if (note) notes.push({ ...note, storageKey: key });
  }
  return notes;
};
