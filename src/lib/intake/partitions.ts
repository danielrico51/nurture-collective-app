import type { IntakeStatus } from "@/types/intake";

/** Prefix for listing all partitioned intake objects. */
export const INTAKE_PARTITION_LIST_PREFIX = "management/process=intake/";

const PARTITION_FILE = "intake.json";

/** Safe path segment for Hive-style partition keys (user id, email slug, etc.). */
export const sanitizePartitionSegment = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-z0-9._@-]+/g, "_").slice(0, 128);
};

/** Cognito sub is the canonical storage user key; email is a readable fallback. */
export const resolveStorageUserKey = (
  userId: string,
  email?: string | null
): string => {
  if (userId.trim()) return sanitizePartitionSegment(userId);
  if (email?.trim()) return sanitizePartitionSegment(email);
  return "unknown";
};

export const buildIntakePartitionKey = (
  userKey: string,
  status: IntakeStatus
): string =>
  `${INTAKE_PARTITION_LIST_PREFIX}user=${sanitizePartitionSegment(userKey)}/status=${status}/${PARTITION_FILE}`;

export const buildIntakeUserPrefix = (userKey: string): string =>
  `${INTAKE_PARTITION_LIST_PREFIX}user=${sanitizePartitionSegment(userKey)}/`;

export interface ParsedIntakePartitionKey {
  userKey: string;
  status: IntakeStatus;
  key: string;
}

const PARTITION_KEY_PATTERN =
  /^management\/process=intake\/user=([^/]+)\/status=(draft|submitted|in-review)\/intake\.json$/;

export const parseIntakePartitionKey = (
  key: string
): ParsedIntakePartitionKey | null => {
  const match = key.match(PARTITION_KEY_PATTERN);
  if (!match) return null;
  return {
    userKey: match[1],
    status: match[2] as IntakeStatus,
    key,
  };
};
