import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  CareRecommendation,
  IntakeDocument,
  IntakeDraft,
  IntakeProfile,
} from "@/types/intake";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import {
  readLocalIntakeDocument,
  writeLocalIntakeDocument,
} from "@/lib/intake/localStorage";
import { createEmptyProfile, normalizeProfile } from "@/lib/intake/normalize";
import { generateRecommendations } from "@/lib/intake/recommendations";

const DEFAULT_KEY = "management/intake.json";
const DEFAULT_BUCKET = "nurture-collective-tasks";

const emptyDocument = (): IntakeDocument => ({
  version: 1,
  profiles: [],
  recommendations: [],
  updatedAt: new Date().toISOString(),
});

const isLocalStorageEnabled = () => {
  if (process.env.INTAKE_USE_LOCAL_STORAGE === "true") return true;
  if (process.env.INTAKE_S3_BUCKET?.trim()) return false;
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

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

const getBucket = () =>
  process.env.INTAKE_S3_BUCKET?.trim() ||
  process.env.TASKS_S3_BUCKET?.trim() ||
  DEFAULT_BUCKET;

const getObjectKey = () =>
  process.env.INTAKE_S3_KEY?.trim() || DEFAULT_KEY;

export const getIntakeStorageMode = (): "local" | "s3" =>
  isLocalStorageEnabled() ? "local" : "s3";

const readS3IntakeDocument = async (): Promise<IntakeDocument> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket, Key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return emptyDocument();

    const parsed = JSON.parse(body) as IntakeDocument;
    if (!Array.isArray(parsed.profiles)) return emptyDocument();
    return {
      ...parsed,
      profiles: parsed.profiles.map((profile) => normalizeProfile(profile)),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return emptyDocument();
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      err.name === "NoSuchKey" ||
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return emptyDocument();
    }
    throw error;
  }
};

const writeS3IntakeDocument = async (
  document: IntakeDocument
): Promise<void> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  const payload: IntakeDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

export const readIntakeDocument = async (): Promise<IntakeDocument> => {
  if (isLocalStorageEnabled()) {
    return readLocalIntakeDocument();
  }
  return readS3IntakeDocument();
};

export const writeIntakeDocument = async (
  document: IntakeDocument
): Promise<void> => {
  if (isLocalStorageEnabled()) {
    return writeLocalIntakeDocument(document);
  }
  return writeS3IntakeDocument(document);
};

export const getProfileByUserId = async (
  userId: string
): Promise<IntakeProfile | null> => {
  const doc = await readIntakeDocument();
  const profile = doc.profiles.find((item) => item.userId === userId);
  return profile ? normalizeProfile(profile) : null;
};

export const getRecommendationsForUser = async (
  userId: string
): Promise<CareRecommendation[]> => {
  const doc = await readIntakeDocument();
  return doc.recommendations.filter((item) => item.userId === userId);
};

export const getIntakeForUser = async (userId: string) => {
  const doc = await readIntakeDocument();
  const profile =
    doc.profiles.find((item) => item.userId === userId) ?? null;
  const recommendations = doc.recommendations.filter(
    (item) => item.userId === userId
  );
  return {
    profile: profile ? normalizeProfile(profile) : null,
    recommendations,
  };
};

export const listAllIntakes = async () => {
  const doc = await readIntakeDocument();
  const profiles = doc.profiles
    .map((profile) => normalizeProfile(profile))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  return {
    profiles,
    recommendations: doc.recommendations,
  };
};

export const upsertProfileDraft = async (
  userId: string,
  draft: IntakeDraft
): Promise<IntakeProfile> => {
  const doc = await readIntakeDocument();
  const index = doc.profiles.findIndex((item) => item.userId === userId);
  const now = new Date().toISOString();

  if (index === -1) {
    const profile = normalizeProfile(
      createEmptyProfile(userId, {
        ...draft,
        intakeStatus: "draft",
        createdAt: now,
        updatedAt: now,
      })
    );
    doc.profiles.push(profile);
    await writeIntakeDocument(doc);
    return profile;
  }

  const existing = normalizeProfile(doc.profiles[index]);
  const preserveStatus =
    existing.intakeStatus === "submitted" ||
    existing.intakeStatus === "in-review";
  const updated = normalizeProfile({
    ...existing,
    ...draft,
    userId,
    intakeStatus: preserveStatus ? existing.intakeStatus : "draft",
    updatedAt: now,
  });
  doc.profiles[index] = updated;
  await writeIntakeDocument(doc);
  return updated;
};

export const submitProfile = async (
  userId: string,
  draft: IntakeDraft
): Promise<{ profile: IntakeProfile; recommendations: CareRecommendation[] }> => {
  const doc = await readIntakeDocument();
  const index = doc.profiles.findIndex((item) => item.userId === userId);
  const now = new Date().toISOString();

  const base =
    index === -1
      ? createEmptyProfile(userId)
      : normalizeProfile(doc.profiles[index]);

  const profile = normalizeProfile({
    ...base,
    ...draft,
    userId,
    intakeStatus: "submitted",
    updatedAt: now,
  });

  if (index === -1) {
    doc.profiles.push(profile);
  } else {
    doc.profiles[index] = profile;
  }

  const recommendations = generateRecommendations(profile);
  doc.recommendations = [
    ...doc.recommendations.filter((item) => item.userId !== userId),
    ...recommendations,
  ];

  await writeIntakeDocument(doc);
  return { profile, recommendations };
};

export const updateProfileStatus = async (
  profileId: string,
  intakeStatus: IntakeProfile["intakeStatus"]
): Promise<IntakeProfile> => {
  const doc = await readIntakeDocument();
  const index = doc.profiles.findIndex((item) => item.id === profileId);
  if (index === -1) {
    throw new Error("Intake profile not found");
  }

  const updated = normalizeProfile({
    ...doc.profiles[index],
    intakeStatus,
    updatedAt: new Date().toISOString(),
  });
  doc.profiles[index] = updated;
  await writeIntakeDocument(doc);
  return updated;
};
