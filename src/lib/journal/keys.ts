import { sanitizePartitionSegment } from "@/lib/intake/partitions";

export const JOURNAL_ROOT_PREFIX = "journal/v1/users/";

export const resolveJournalUserKey = (
  userId: string,
  email?: string | null
): string => {
  if (userId.trim()) return sanitizePartitionSegment(userId);
  if (email?.trim()) return sanitizePartitionSegment(email);
  return "unknown";
};

export const journalUserPrefix = (userKey: string) =>
  `${JOURNAL_ROOT_PREFIX}${sanitizePartitionSegment(userKey)}/`;

export const journalProfileKey = (userKey: string) =>
  `${journalUserPrefix(userKey)}profile.json`;

export const journalTimelineKey = (userKey: string) =>
  `${journalUserPrefix(userKey)}timeline.json`;

export const journalIndexKey = (userKey: string) =>
  `${journalUserPrefix(userKey)}index.json`;

export const journalEntryKey = (userKey: string, entryId: string) =>
  `${journalUserPrefix(userKey)}entries/${entryId}.json`;
