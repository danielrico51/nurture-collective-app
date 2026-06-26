import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import {
  buildProviderKeyForCrm,
  buildProviderListPrefixForCrm,
  PROVIDER_FILENAME,
} from "@/lib/providers/paths";
import type { ProviderRecord } from "@/types/provider";

export interface ProviderStorageScope {
  bucket: string;
  crmPrefix: string;
}

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const readJsonFromBucket = async <T>(
  bucket: string,
  key: string
): Promise<T | null> => {
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

const listKeysFromBucket = async (
  bucket: string,
  prefix: string
): Promise<string[]> => {
  const keys: string[] = [];
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
      if (item.Key) keys.push(item.Key);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
};

/** Read provider records from an explicit bucket + CRM prefix (read-only). */
export const listProvidersFromScope = async (
  scope: ProviderStorageScope,
  options?: { includeArchived?: boolean }
): Promise<ProviderRecord[]> => {
  const includeArchived = options?.includeArchived ?? false;
  const prefix = buildProviderListPrefixForCrm(scope.crmPrefix);
  const keys = (await listKeysFromBucket(scope.bucket, prefix)).filter((key) =>
    key.endsWith(`/${PROVIDER_FILENAME}`)
  );

  const providers: ProviderRecord[] = [];
  for (const key of keys) {
    const record = await readJsonFromBucket<ProviderRecord>(scope.bucket, key);
    if (!record) continue;
    if (!includeArchived && record.archivedAt) continue;
    providers.push({ ...record, storageKey: key });
  }

  providers.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    })
  );
  return providers;
};

export const readProviderFromScope = async (
  scope: ProviderStorageScope,
  providerId: string
): Promise<ProviderRecord | null> => {
  const key = buildProviderKeyForCrm(scope.crmPrefix, providerId);
  const record = await readJsonFromBucket<ProviderRecord>(scope.bucket, key);
  if (!record) return null;
  return { ...record, storageKey: key };
};

/** Prod scope defaults: `crm/` prefix on the prod clients bucket. */
export const resolveProdProviderScope = (): ProviderStorageScope => {
  const bucket = process.env.PROD_NURTURE_CLIENTS_BUCKET?.trim() || "";
  if (!bucket) {
    throw new Error(
      "PROD_NURTURE_CLIENTS_BUCKET is required to read production providers"
    );
  }
  return { bucket, crmPrefix: "crm/" };
};
