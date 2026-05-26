import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import {
  INTAKE_PARTITION_LIST_PREFIX,
  buildIntakePartitionKey,
  parseIntakePartitionKey,
  resolveStorageUserKey,
  sanitizePartitionSegment,
} from "@/lib/intake/partitions";
import { normalizeProfile } from "@/lib/intake/normalize";
import type {
  IntakeProfile,
  IntakeStatus,
  PartitionedIntakeRecord,
} from "@/types/intake";

const LOCAL_ROOT = path.join(process.cwd(), ".data");

const localPathForKey = (key: string) => path.join(LOCAL_ROOT, key);

const normalizeRecord = (
  raw: Partial<PartitionedIntakeRecord>,
  storageKey?: string
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

const walkPartitionFiles = async (
  dir: string,
  relativePrefix: string,
  keys: string[]
): Promise<void> => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    const relative = `${relativePrefix}${entry.name}`;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkPartitionFiles(full, `${relative}/`, keys);
    } else if (entry.isFile() && entry.name === "intake.json") {
      keys.push(relative);
    }
  }
};

export const listLocalPartitionKeys = async (): Promise<string[]> => {
  const keys: string[] = [];
  await walkPartitionFiles(
    localPathForKey(INTAKE_PARTITION_LIST_PREFIX),
    INTAKE_PARTITION_LIST_PREFIX,
    keys
  );
  return keys;
};

export const readLocalPartitionRecord = async (
  key: string
): Promise<PartitionedIntakeRecord | null> => {
  try {
    const body = await readFile(localPathForKey(key), "utf8");
    const parsed = JSON.parse(body) as PartitionedIntakeRecord;
    return normalizeRecord(parsed, key);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw error;
  }
};

export const writeLocalPartitionRecord = async (
  record: PartitionedIntakeRecord
): Promise<string> => {
  const userKey = resolveStorageUserKey(
    record.profile.userId,
    record.profile.email
  );
  const key = buildIntakePartitionKey(userKey, record.profile.intakeStatus);
  const filePath = localPathForKey(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  const payload: PartitionedIntakeRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
    storageKey: key,
  };
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return key;
};

export const deleteLocalPartitionKeys = async (keys: string[]): Promise<void> => {
  await Promise.all(
    keys.map(async (key) => {
      try {
        await rm(localPathForKey(key), { force: true });
      } catch {
        /* ignore missing files */
      }
    })
  );
};

export const deleteLocalStalePartitionsForUser = async (
  userKey: string,
  keepStatus: IntakeStatus
): Promise<void> => {
  const sanitized = sanitizePartitionSegment(userKey);
  const keys = (await listLocalPartitionKeys()).filter((key) => {
    const parsed = parseIntakePartitionKey(key);
    return parsed?.userKey === sanitized && parsed.status !== keepStatus;
  });
  await deleteLocalPartitionKeys(keys);
};

export const listLocalPartitionRecords = async (): Promise<
  PartitionedIntakeRecord[]
> => {
  const keys = await listLocalPartitionKeys();
  const records = await Promise.all(keys.map((key) => readLocalPartitionRecord(key)));
  return records.filter((record): record is PartitionedIntakeRecord => record !== null);
};

export const findLocalPartitionKeysForUser = async (
  userId: string,
  email?: string | null
): Promise<string[]> => {
  const sanitized = sanitizePartitionSegment(
    resolveStorageUserKey(userId, email)
  );
  return (await listLocalPartitionKeys()).filter((key) => {
    const parsed = parseIntakePartitionKey(key);
    return parsed?.userKey === sanitized;
  });
};
