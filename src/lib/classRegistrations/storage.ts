import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { classRegistrationConfig } from "@/lib/classRegistrations/config";
import {
  buildClassRegistrationKey,
  buildClassRegistrationListPrefix,
  parseClassRegistrationIdFromKey,
} from "@/lib/classRegistrations/paths";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import type { ClassRegistration } from "@/types/classRegistration";

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const localRegistrationPath = (registrationId: string) =>
  path.join(
    process.cwd(),
    ".data",
    buildClassRegistrationKey(registrationId)
  );

export const readClassRegistration = async (
  registrationId: string
): Promise<ClassRegistration | null> => {
  if (classRegistrationConfig.useLocalStorage) {
    try {
      const raw = await readFile(localRegistrationPath(registrationId), "utf8");
      return JSON.parse(raw) as ClassRegistration;
    } catch {
      return null;
    }
  }

  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: classRegistrationConfig.s3Bucket,
        Key: buildClassRegistrationKey(registrationId),
      })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as ClassRegistration;
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

export const writeClassRegistration = async (
  registration: ClassRegistration
): Promise<ClassRegistration> => {
  const payload: ClassRegistration = {
    ...registration,
    updatedAt: new Date().toISOString(),
  };

  if (classRegistrationConfig.useLocalStorage) {
    const filePath = localRegistrationPath(registration.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    return payload;
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: classRegistrationConfig.s3Bucket,
      Key: buildClassRegistrationKey(registration.id),
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );

  return payload;
};

const listRegistrationIdsFromS3 = async (): Promise<string[]> => {
  const prefix = buildClassRegistrationListPrefix();
  const ids: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: classRegistrationConfig.s3Bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of response.Contents ?? []) {
      if (!item.Key) continue;
      const id = parseClassRegistrationIdFromKey(item.Key);
      if (id) ids.push(id);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return ids;
};

const listRegistrationIdsLocal = async (): Promise<string[]> => {
  const root = path.join(process.cwd(), ".data", buildClassRegistrationListPrefix());
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("reg_id="))
      .map((entry) => entry.name.replace(/^reg_id=/, ""));
  } catch {
    return [];
  }
};

export const listClassRegistrations = async (
  eventSlug?: string
): Promise<ClassRegistration[]> => {
  const ids = classRegistrationConfig.useLocalStorage
    ? await listRegistrationIdsLocal()
    : await listRegistrationIdsFromS3();

  const registrations = await Promise.all(ids.map((id) => readClassRegistration(id)));

  return registrations
    .filter((entry): entry is ClassRegistration => entry !== null)
    .filter((entry) => (eventSlug ? entry.eventSlug === eventSlug : true))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};
