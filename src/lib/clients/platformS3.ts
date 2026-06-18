import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { clientsCrmStorageConfig, getClientsCrmBucket } from "@/lib/clients/config";
import {
  buildClientArtifactKey,
  buildClientByEmailIndexKey,
  buildClientByLeadIndexKey,
  buildClientListPrefix,
  buildClientRootPrefix,
  CLIENT_COMM_FILENAME,
  CLIENT_NOTE_FILENAME,
  CLIENT_PROFILE_FILENAME,
  parseClientIdFromKey,
  type ClientIndexEntry,
} from "@/lib/clients/paths";
import type {
  ClientCommunication,
  ClientNote,
  ClientRecord,
} from "@/types/client";

const getClient = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

/** Client CRM records colocate with proposals/billing in the clients bucket. */
export { getClientsCrmBucket } from "@/lib/clients/config";

export const readClientsJson = async <T>(key: string): Promise<T | null> => {
  const Bucket = getClientsCrmBucket();
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
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

export const writeClientsJson = async (
  key: string,
  payload: unknown
): Promise<void> => {
  const Bucket = getClientsCrmBucket();
  if (!Bucket) throw new Error("NURTURE_CLIENTS_BUCKET is not configured");
  await getClient().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

export const deleteClientsJson = async (key: string): Promise<void> => {
  const Bucket = getClientsCrmBucket();
  if (!Bucket) return;
  await getClient().send(new DeleteObjectCommand({ Bucket, Key: key }));
};

export const listClientsKeys = async (
  prefix = buildClientListPrefix()
): Promise<string[]> => {
  const Bucket = getClientsCrmBucket();
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

export const listS3ClientIds = async (): Promise<string[]> => {
  const keys = await listClientsKeys();
  const ids = new Set<string>();
  for (const key of keys) {
    const id = parseClientIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

export const appendS3ClientProfile = async (
  client: ClientRecord
): Promise<string> => {
  const key = buildClientArtifactKey(
    client.clientId,
    "profile",
    CLIENT_PROFILE_FILENAME
  );
  await writeClientsJson(key, { ...client, storageKey: key });
  return key;
};

export const appendS3ClientNote = async (note: ClientNote): Promise<string> => {
  const key = buildClientArtifactKey(
    note.clientId,
    "notes",
    CLIENT_NOTE_FILENAME
  );
  await writeClientsJson(key, { ...note, storageKey: key });
  return key;
};

export const appendS3ClientCommunication = async (
  comm: ClientCommunication
): Promise<string> => {
  const key = buildClientArtifactKey(
    comm.clientId,
    "communications",
    CLIENT_COMM_FILENAME
  );
  await writeClientsJson(key, { ...comm, storageKey: key });
  return key;
};

export const getLatestS3ClientProfile = async (
  clientId: string
): Promise<ClientRecord | null> => {
  const prefix = `${buildClientRootPrefix(clientId)}profile/`;
  const keys = (await listClientsKeys(prefix))
    .filter((key) => key.endsWith(`/${CLIENT_PROFILE_FILENAME}`))
    .sort()
    .reverse();
  for (const key of keys) {
    const record = await readClientsJson<ClientRecord>(key);
    if (record) return { ...record, storageKey: key };
  }
  return null;
};

export const listS3NotesForClient = async (
  clientId: string
): Promise<ClientNote[]> => {
  const prefix = `${buildClientRootPrefix(clientId)}notes/`;
  const keys = (await listClientsKeys(prefix))
    .filter((key) => key.endsWith(`/${CLIENT_NOTE_FILENAME}`))
    .sort()
    .reverse();
  const notes: ClientNote[] = [];
  for (const key of keys) {
    const note = await readClientsJson<ClientNote>(key);
    if (note) notes.push({ ...note, storageKey: key });
  }
  return notes;
};

export const listS3CommunicationsForClient = async (
  clientId: string
): Promise<ClientCommunication[]> => {
  const prefix = `${buildClientRootPrefix(clientId)}communications/`;
  const keys = (await listClientsKeys(prefix))
    .filter((key) => key.endsWith(`/${CLIENT_COMM_FILENAME}`))
    .sort()
    .reverse();
  const comms: ClientCommunication[] = [];
  for (const key of keys) {
    const comm = await readClientsJson<ClientCommunication>(key);
    if (comm) comms.push({ ...comm, storageKey: key });
  }
  return comms;
};

export const writeS3ClientLeadIndex = async (
  leadId: string,
  clientId: string
): Promise<void> => {
  await writeClientsJson(buildClientByLeadIndexKey(leadId), { clientId });
};

export const writeS3ClientEmailIndex = async (
  email: string,
  clientId: string
): Promise<void> => {
  await writeClientsJson(buildClientByEmailIndexKey(email), { clientId });
};

export const readS3ClientLeadIndex = async (
  leadId: string
): Promise<string | null> => {
  const entry = await readClientsJson<ClientIndexEntry>(
    buildClientByLeadIndexKey(leadId)
  );
  return entry?.clientId ?? null;
};

export const readS3ClientEmailIndex = async (
  email: string
): Promise<string | null> => {
  const entry = await readClientsJson<ClientIndexEntry>(
    buildClientByEmailIndexKey(email)
  );
  return entry?.clientId ?? null;
};
