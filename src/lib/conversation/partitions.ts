import { sanitizePartitionSegment } from "@/lib/intake/partitions";

export const CONVERSATION_PARTITION_PREFIX =
  "management/process=conversation/";

export const buildConversationPartitionKey = (
  userKey: string,
  sessionId: string
): string =>
  `${CONVERSATION_PARTITION_PREFIX}user=${sanitizePartitionSegment(userKey)}/session=${sanitizePartitionSegment(sessionId)}/conversation.json`;

export const buildConversationUserPrefix = (userKey: string): string =>
  `${CONVERSATION_PARTITION_PREFIX}user=${sanitizePartitionSegment(userKey)}/`;
