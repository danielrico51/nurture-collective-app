import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  INTAKE_PARTITION_LIST_PREFIX,
  buildIntakePartitionKey,
  buildIntakeUserPrefix,
  parseIntakePartitionKey,
  resolveStorageUserKey,
} from "@/lib/intake/partitions";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { normalizeProfile } from "@/lib/intake/normalize";
import type {
  IntakeProfile,
  IntakeStatus,
  PartitionedIntakeRecord,
} from "@/types/intake";

const DEFAULT_BUCKET = "nurture-collective-tasks";

const getS3Client = () => {
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  return new S3Client({
    region,
    credentials: getServerCredentials(),
  });
};

export const getIntakeBucket = () =>
  process.env.INTAKE_S3_BUCKET?.trim() ||
  process.env.TASKS_S3_BUCKET?.trim() ||
  DEFAULT_BUCKET;

const isNotFound = (error: unknown) => {
  if (error instanceof NoSuchKey) return true;
  const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    err.name === "NoSuchKey" ||
    err.name === "NotFound" ||
    err.$metadata?.httpStatusCode === 404
  );
};

const isAccessDenied = (error: unknown) => {
  const err = error as { name?: string; message?: string };
  const message = err.message ?? "";
  return (
    err.name === "AccessDenied" ||
    message.includes("AccessDenied") ||
    message.includes("Access Denied") ||
    message.includes("not authorized")
  );
};

const normalizeRecord = (
  raw: Partial<PartitionedIntakeRecord>,
  storageKey: string
): PartitionedIntakeRecord | null => {
  if (!raw.profile?.userId) return null;
  return {
    version: 1,
    profile: normalizeProfile(raw.profile),
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    storageKey,
  };
};

export const readS3ObjectJson = async <T>(key: string): Promise<T | null> => {
  const client = getS3Client();
  const Bucket = getIntakeBucket();

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket, Key: key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (error) {
    if (isNotFound(error)) return null;
    if (isAccessDenied(error)) {
      console.warn(`[s3] Access denied reading s3://${Bucket}/${key}`);
      return null;
    }
    throw error;
  }
};

export const writeS3ObjectJson = async (key: string, payload: unknown): Promise<void> => {
  const client = getS3Client();
  const Bucket = getIntakeBucket();
  await client.send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

export const deleteS3Objects = async (keys: string[]): Promise<void> => {
  if (keys.length === 0) return;
  const client = getS3Client();
  const Bucket = getIntakeBucket();
  await Promise.all(
    keys.map((Key) => client.send(new DeleteObjectCommand({ Bucket, Key })))
  );
};

export const listS3ObjectKeysWithPrefix = async (
  prefix: string
): Promise<string[]> => {
  const client = getS3Client();
  const Bucket = getIntakeBucket();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
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

export const listS3PartitionKeys = async (): Promise<string[]> => {
  const keys = await listS3ObjectKeysWithPrefix(INTAKE_PARTITION_LIST_PREFIX);
  return keys.filter((key) => parseIntakePartitionKey(key));
};

export const readS3PartitionRecord = async (
  key: string
): Promise<PartitionedIntakeRecord | null> => {
  const parsed = await readS3ObjectJson<PartitionedIntakeRecord>(key);
  if (!parsed) return null;
  return normalizeRecord(parsed, key);
};

export const writeS3PartitionRecord = async (
  record: PartitionedIntakeRecord
): Promise<string> => {
  const userKey = resolveStorageUserKey(
    record.profile.userId,
    record.profile.email
  );
  const key = buildIntakePartitionKey(userKey, record.profile.intakeStatus);
  const payload: PartitionedIntakeRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
    storageKey: key,
  };
  await writeS3ObjectJson(key, payload);
  return key;
};

export const listS3PartitionRecords = async (): Promise<PartitionedIntakeRecord[]> => {
  const keys = await listS3PartitionKeys();
  const records = await Promise.all(keys.map((key) => readS3PartitionRecord(key)));
  return records.filter((record): record is PartitionedIntakeRecord => record !== null);
};

export const findS3PartitionKeysForUser = async (
  userId: string,
  email?: string | null
): Promise<string[]> => {
  const userKey = resolveStorageUserKey(userId, email);
  const prefix = buildIntakeUserPrefix(userKey);
  const client = getS3Client();
  const Bucket = getIntakeBucket();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of response.Contents ?? []) {
      if (item.Key?.endsWith("/intake.json")) keys.push(item.Key);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
};

export const deleteS3StalePartitionsForUser = async (
  profile: IntakeProfile,
  keepStatus: IntakeStatus
): Promise<void> => {
  const keys = await findS3PartitionKeysForUser(profile.userId, profile.email);
  const stale = keys.filter((key) => {
    const parsed = parseIntakePartitionKey(key);
    return parsed && parsed.status !== keepStatus;
  });
  await deleteS3Objects(stale);
};
