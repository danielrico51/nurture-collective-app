import "server-only";

import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";

let cachedClient: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (cachedClient) return cachedClient;
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  cachedClient = new S3Client({ region, credentials: getServerCredentials() });
  return cachedClient;
};

/**
 * Bucket used for user-uploaded binary media (post images, avatars).
 * Falls back to the shared tasks bucket so a single bucket can serve everything.
 */
export const getMediaBucket = (): string | null =>
  process.env.COMMUNITY_MEDIA_S3_BUCKET?.trim() ||
  process.env.MEDIA_S3_BUCKET?.trim() ||
  process.env.TASKS_S3_BUCKET?.trim() ||
  null;

/** True when S3-backed media storage is configured (i.e. production). */
export const isMediaS3Enabled = (): boolean => Boolean(getMediaBucket());

const isNotFound = (error: unknown): boolean => {
  if (error instanceof NoSuchKey) return true;
  const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    err.name === "NoSuchKey" ||
    err.name === "NotFound" ||
    err.$metadata?.httpStatusCode === 404
  );
};

export const putMediaObject = async (
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> => {
  const Bucket = getMediaBucket();
  if (!Bucket) throw new Error("Media bucket is not configured");
  await getS3Client().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=3600",
    })
  );
};

/**
 * Presigned PUT URL so the browser can upload binary directly to S3,
 * bypassing the Amplify CDN/SSR layer (which blocks large request bodies).
 * The client must PUT with the exact same Content-Type used here.
 */
export const createPresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresInSeconds = 120
): Promise<string> => {
  const Bucket = getMediaBucket();
  if (!Bucket) throw new Error("Media bucket is not configured");
  return getSignedUrl(
    getS3Client(),
    new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
};

export const getMediaObject = async (
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> => {
  const Bucket = getMediaBucket();
  if (!Bucket) throw new Error("Media bucket is not configured");
  try {
    const response = await getS3Client().send(
      new GetObjectCommand({ Bucket, Key: key })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      buffer: Buffer.from(bytes),
      contentType: response.ContentType ?? "application/octet-stream",
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
};
