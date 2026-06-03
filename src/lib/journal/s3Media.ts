import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { getIntakeBucket } from "@/lib/intake/s3Storage";

const getClient = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ??
      process.env.NEXT_PUBLIC_AWS_REGION ??
      "us-east-1",
    credentials: getServerCredentials(),
  });

const isNotFound = (error: unknown): boolean => {
  const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    err.name === "NoSuchKey" ||
    err.name === "NotFound" ||
    err.$metadata?.httpStatusCode === 404
  );
};

export const isJournalMediaS3Enabled = (): boolean =>
  Boolean(
    process.env.JOURNAL_S3_BUCKET?.trim() ||
      process.env.INTAKE_S3_BUCKET?.trim() ||
      process.env.TASKS_S3_BUCKET?.trim()
  );

export const getJournalMediaObject = async (
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> => {
  const Bucket = getIntakeBucket();
  try {
    const response = await getClient().send(
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
    const err = error as { name?: string; message?: string };
    if (
      err.name === "AccessDenied" ||
      (err.message ?? "").includes("AccessDenied")
    ) {
      console.warn(`[journal-media] Access denied s3://${Bucket}/${key}`);
      return null;
    }
    throw error;
  }
};

export const putJournalMediaObject = async (
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> => {
  const Bucket = getIntakeBucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=3600",
    })
  );
};

export const createJournalPresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresInSeconds = 120
): Promise<string> => {
  const Bucket = getIntakeBucket();
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
};
