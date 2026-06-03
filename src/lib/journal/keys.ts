import { sanitizePartitionSegment } from "@/lib/intake/partitions";

/** Hive-style prefix under the tasks bucket (same IAM scope as intake/conversation). */
export const JOURNAL_PARTITION_PREFIX = "management/process=journal/";

export const resolveJournalUserKey = (
  userId: string,
  email?: string | null
): string => {
  if (userId.trim()) return sanitizePartitionSegment(userId);
  if (email?.trim()) return sanitizePartitionSegment(email);
  return "unknown";
};

export const buildJournalUserPrefix = (userKey: string) =>
  `${JOURNAL_PARTITION_PREFIX}user=${sanitizePartitionSegment(userKey)}/`;

export const journalProfileKey = (userKey: string) =>
  `${buildJournalUserPrefix(userKey)}profile.json`;

export const journalTimelineKey = (userKey: string) =>
  `${buildJournalUserPrefix(userKey)}timeline.json`;

export const journalIndexKey = (userKey: string) =>
  `${buildJournalUserPrefix(userKey)}index.json`;

export const journalEntryKey = (userKey: string, entryId: string) =>
  `${buildJournalUserPrefix(userKey)}entries/${sanitizePartitionSegment(entryId)}.json`;
