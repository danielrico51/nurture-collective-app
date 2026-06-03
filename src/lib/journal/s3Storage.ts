import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { getIntakeBucket } from "@/lib/intake/s3Storage";

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

const isNotFound = (error: unknown) => {
  const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    err.name === "NoSuchKey" ||
    err.name === "NotFound" ||
    err.$metadata?.httpStatusCode === 404
  );
};

export const readJournalS3Json = async <T>(key: string): Promise<T | null> => {
  const client = getS3Client();
  const Bucket = getIntakeBucket();

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket, Key: key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new Error(
        `Invalid JSON in journal object s3://${Bucket}/${key}`
      );
    }
  } catch (error) {
    if (isNotFound(error)) return null;
    const err = error as { name?: string; message?: string };
    if (
      err.name === "AccessDenied" ||
      (err.message ?? "").includes("AccessDenied")
    ) {
      throw new Error(
        `Access denied reading journal object s3://${Bucket}/${key}. ` +
          "Grant s3:GetObject on management/process=journal/* for the Amplify compute role or SERVER_AWS IAM user."
      );
    }
    throw error;
  }
};

export const writeJournalS3Json = async (
  key: string,
  payload: unknown
): Promise<void> => {
  const client = getS3Client();
  const Bucket = getIntakeBucket();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket,
        Key: key,
        Body: JSON.stringify(payload, null, 2),
        ContentType: "application/json",
      })
    );
  } catch (error) {
    const err = error as { name?: string; message?: string };
    const name = err.name ?? "S3Error";
    const message = err.message ?? "Unknown S3 error";
    throw new Error(
      `Journal S3 PutObject failed (${name}): ${message} [s3://${Bucket}/${key}]`
    );
  }
};
