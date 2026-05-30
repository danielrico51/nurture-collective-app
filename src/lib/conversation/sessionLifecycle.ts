import { computeMissingFields } from "@/lib/conversation/profileMapper";
import {
  listConversationSessionsForUser,
  saveConversationSession,
} from "@/lib/conversation/storage";
import type { ConversationSession } from "@/types/conversation";

export const isConversationProfileIncomplete = (
  session: ConversationSession
): boolean => computeMissingFields(session.extractedProfile).length > 0;

/** Reopen a completed session when intake fields are still missing. */
export const reactivateConversationIfIncomplete = async (
  session: ConversationSession
): Promise<ConversationSession> => {
  if (session.status !== "completed" || !isConversationProfileIncomplete(session)) {
    return session;
  }
  return saveConversationSession({
    ...session,
    status: "active",
    updatedAt: new Date().toISOString(),
  });
};

export const getLatestIncompleteCompletedSession = async (
  userId: string,
  email?: string | null
): Promise<ConversationSession | null> => {
  const sessions = await listConversationSessionsForUser(userId, email);
  const sorted = sessions
    .filter(
      (item) =>
        item.status === "completed" && isConversationProfileIncomplete(item)
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  return sorted[0] ?? null;
};
