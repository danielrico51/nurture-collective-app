import type {
  CareRecommendation,
  IntakeDraft,
  IntakeProfile,
  IntakeStatus,
  PartitionedIntakeRecord,
} from "@/types/intake";
import {
  deleteLocalStalePartitionsForUser,
  findLocalPartitionKeysForUser,
  listLocalPartitionRecords,
  readLocalPartitionRecord,
  writeLocalPartitionRecord,
} from "@/lib/intake/localPartitionStorage";
import {
  deleteS3StalePartitionsForUser,
  findS3PartitionKeysForUser,
  listS3PartitionRecords,
  readS3PartitionRecord,
  writeS3PartitionRecord,
} from "@/lib/intake/s3Storage";
import { createEmptyProfile, normalizeProfile } from "@/lib/intake/normalize";
import { generateRecommendations } from "@/lib/intake/recommendations";
import { resolveStorageUserKey } from "@/lib/intake/partitions";

const isLocalStorageEnabled = () => {
  if (process.env.INTAKE_USE_LOCAL_STORAGE === "true") return true;
  if (process.env.INTAKE_S3_BUCKET?.trim()) return false;
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

export const getIntakeStorageMode = (): "local" | "s3" =>
  isLocalStorageEnabled() ? "local" : "s3";

const STATUS_RANK: Record<IntakeStatus, number> = {
  draft: 0,
  submitted: 1,
  "in-review": 2,
};

const listAllPartitionRecords = async (): Promise<PartitionedIntakeRecord[]> =>
  isLocalStorageEnabled()
    ? listLocalPartitionRecords()
    : listS3PartitionRecords();

/** Prefer highest workflow status, then most recently updated. */
export const pickBestRecordForUser = (
  records: PartitionedIntakeRecord[],
  userId: string
): PartitionedIntakeRecord | null => {
  const matches = records.filter((record) => record.profile.userId === userId);
  if (matches.length === 0) return null;

  return matches.sort((a, b) => {
    const rankDiff =
      STATUS_RANK[b.profile.intakeStatus] -
      STATUS_RANK[a.profile.intakeStatus];
    if (rankDiff !== 0) return rankDiff;
    return (
      new Date(b.profile.updatedAt).getTime() -
      new Date(a.profile.updatedAt).getTime()
    );
  })[0];
};

const loadRecordsForUser = async (
  userId: string,
  email?: string | null
): Promise<PartitionedIntakeRecord[]> => {
  if (isLocalStorageEnabled()) {
    const keys = await findLocalPartitionKeysForUser(userId, email);
    const records = (
      await Promise.all(keys.map((key) => readLocalPartitionRecord(key)))
    ).filter((record): record is PartitionedIntakeRecord => record !== null);
    return records;
  }

  const keys = await findS3PartitionKeysForUser(userId, email);
  const records = (
    await Promise.all(keys.map((key) => readS3PartitionRecord(key)))
  ).filter((record): record is PartitionedIntakeRecord => record !== null);
  return records;
};

const persistUserRecord = async (
  profile: IntakeProfile,
  recommendations: CareRecommendation[]
): Promise<PartitionedIntakeRecord> => {
  const record: PartitionedIntakeRecord = {
    version: 1,
    profile: normalizeProfile(profile),
    recommendations,
    updatedAt: new Date().toISOString(),
  };

  if (isLocalStorageEnabled()) {
    const userKey = resolveStorageUserKey(profile.userId, profile.email);
    await deleteLocalStalePartitionsForUser(userKey, profile.intakeStatus);
    const storageKey = await writeLocalPartitionRecord(record);
    record.storageKey = storageKey;
  } else {
    await deleteS3StalePartitionsForUser(profile, profile.intakeStatus);
    record.storageKey = await writeS3PartitionRecord(record);
  }

  return record;
};

/** Member intake keyed by Cognito sub (and optional email for partition lookup). */
export const getIntakeForUser = async (
  userId: string,
  email?: string | null
) => {
  const records = await loadRecordsForUser(userId, email);
  const record = pickBestRecordForUser(records, userId);
  return {
    profile: record ? normalizeProfile(record.profile) : null,
    recommendations: record?.recommendations ?? [],
  };
};

export const getProfileByUserId = async (
  userId: string,
  email?: string | null
): Promise<IntakeProfile | null> => {
  const { profile } = await getIntakeForUser(userId, email);
  return profile;
};

export const getRecommendationsForUser = async (
  userId: string,
  email?: string | null
): Promise<CareRecommendation[]> => {
  const { recommendations } = await getIntakeForUser(userId, email);
  return recommendations;
};

/** Admin queue — one canonical intake per Cognito sub from partition storage. */
export const listAllIntakes = async () => {
  const records = await listAllPartitionRecords();
  const userIds = Array.from(
    new Set(records.map((record) => record.profile.userId))
  );
  const canonical = userIds
    .map((userId) => pickBestRecordForUser(records, userId))
    .filter((record): record is PartitionedIntakeRecord => record !== null);

  const profiles = canonical
    .map((record) => normalizeProfile(record.profile))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  const recommendations = canonical.flatMap((record) => record.recommendations);
  return { profiles, recommendations };
};

export const upsertProfileDraft = async (
  userId: string,
  draft: IntakeDraft,
  email?: string | null
): Promise<IntakeProfile> => {
  const records = await loadRecordsForUser(userId, email);
  const existing = pickBestRecordForUser(records, userId);
  const now = new Date().toISOString();

  const base = existing
    ? normalizeProfile(existing.profile)
    : createEmptyProfile(userId);

  const preserveStatus =
    base.intakeStatus === "submitted" || base.intakeStatus === "in-review";

  const profile = normalizeProfile({
    ...base,
    ...draft,
    userId,
    intakeStatus: preserveStatus ? base.intakeStatus : "draft",
    updatedAt: now,
  });

  await persistUserRecord(profile, existing?.recommendations ?? []);
  return profile;
};

export const submitProfile = async (
  userId: string,
  draft: IntakeDraft,
  email?: string | null
): Promise<{ profile: IntakeProfile; recommendations: CareRecommendation[] }> => {
  const records = await loadRecordsForUser(userId, email);
  const existing = pickBestRecordForUser(records, userId);
  const now = new Date().toISOString();

  const base = existing
    ? normalizeProfile(existing.profile)
    : createEmptyProfile(userId);

  const profile = normalizeProfile({
    ...base,
    ...draft,
    userId,
    intakeStatus: "submitted",
    updatedAt: now,
  });

  const recommendations = generateRecommendations(profile);
  await persistUserRecord(profile, recommendations);
  return { profile, recommendations };
};

/** Move a member's intake to a new status partition (match by profile id or Cognito sub). */
export const updateProfileStatus = async (
  profileIdOrUserId: string,
  intakeStatus: IntakeProfile["intakeStatus"]
): Promise<IntakeProfile> => {
  const records = await listAllPartitionRecords();
  const existing =
    records.find((record) => record.profile.userId === profileIdOrUserId) ??
    records.find((record) => record.profile.id === profileIdOrUserId);

  if (!existing) {
    throw new Error("Intake profile not found");
  }

  const profile = normalizeProfile({
    ...existing.profile,
    intakeStatus,
    updatedAt: new Date().toISOString(),
  });

  await persistUserRecord(profile, existing.recommendations);
  return profile;
};

export const getPartitionedRecordForUser = async (
  userId: string,
  email?: string | null
): Promise<PartitionedIntakeRecord | null> => {
  const records = await loadRecordsForUser(userId, email);
  return pickBestRecordForUser(records, userId);
};
