import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import {
  buildConversationPartitionKey,
  buildConversationUserPrefix,
  CONVERSATION_PARTITION_PREFIX,
} from "@/lib/conversation/partitions";
import { resolveStorageUserKey } from "@/lib/intake/partitions";
import {
  getIntakeBucket,
  listS3ObjectKeysWithPrefix,
  readS3ObjectJson,
  writeS3ObjectJson,
} from "@/lib/intake/s3Storage";
import { getIntakeStorageMode } from "@/lib/intake/storage";
import type { ConversationSession } from "@/types/conversation";
import { createEmptyExtractedProfile } from "@/types/conversation";

const LOCAL_ROOT = path.join(process.cwd(), ".data");

const localPathForKey = (key: string) => path.join(LOCAL_ROOT, key);

const normalizeSession = (
  raw: Partial<ConversationSession>,
  storageKey?: string
): ConversationSession => ({
  id: raw.id ?? crypto.randomUUID(),
  userId: raw.userId ?? "unknown",
  status: raw.status ?? "active",
  messages: Array.isArray(raw.messages) ? raw.messages : [],
  extractedProfile: {
    ...createEmptyExtractedProfile(),
    ...(raw.extractedProfile ?? {}),
  },
  quickReplies: Array.isArray(raw.quickReplies) ? raw.quickReplies : [],
  safetyEscalation: Boolean(raw.safetyEscalation),
  createdAt: raw.createdAt ?? new Date().toISOString(),
  updatedAt: raw.updatedAt ?? new Date().toISOString(),
  storageKey,
});

const walkJsonFiles = async (
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
      await walkJsonFiles(full, `${relative}/`, keys);
    } else if (entry.isFile() && entry.name === "conversation.json") {
      keys.push(relative);
    }
  }
};

const readLocalSession = async (
  key: string
): Promise<ConversationSession | null> => {
  try {
    const body = await readFile(localPathForKey(key), "utf8");
    return normalizeSession(JSON.parse(body) as ConversationSession, key);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw error;
  }
};

const writeLocalSession = async (
  session: ConversationSession
): Promise<string> => {
  const userKey = resolveStorageUserKey(session.userId, session.extractedProfile.email);
  const key = buildConversationPartitionKey(userKey, session.id);
  await mkdir(path.dirname(localPathForKey(key)), { recursive: true });
  const payload = normalizeSession({ ...session, updatedAt: new Date().toISOString() }, key);
  await writeFile(localPathForKey(key), JSON.stringify(payload, null, 2), "utf8");
  return key;
};

const listLocalConversationKeys = async (): Promise<string[]> => {
  const keys: string[] = [];
  await walkJsonFiles(
    localPathForKey(CONVERSATION_PARTITION_PREFIX),
    CONVERSATION_PARTITION_PREFIX,
    keys
  );
  return keys;
};

export const saveConversationSession = async (
  session: ConversationSession
): Promise<ConversationSession> => {
  if (getIntakeStorageMode() === "local") {
    const storageKey = await writeLocalSession(session);
    return { ...session, storageKey, updatedAt: new Date().toISOString() };
  }
  const userKey = resolveStorageUserKey(session.userId, session.extractedProfile.email);
  const key = buildConversationPartitionKey(userKey, session.id);
  const payload = normalizeSession({ ...session, updatedAt: new Date().toISOString() }, key);
  await writeS3ObjectJson(key, payload);
  return { ...payload, storageKey: key };
};

export const getConversationSession = async (
  userId: string,
  sessionId: string,
  email?: string | null
): Promise<ConversationSession | null> => {
  const userKey = resolveStorageUserKey(userId, email);
  const key = buildConversationPartitionKey(userKey, sessionId);
  if (getIntakeStorageMode() === "local") {
    return readLocalSession(key);
  }
  const raw = await readS3ObjectJson<ConversationSession>(key);
  return raw ? normalizeSession(raw, key) : null;
};

export const getActiveConversationForUser = async (
  userId: string,
  email?: string | null
): Promise<ConversationSession | null> => {
  const sessions = await listConversationSessionsForUser(userId, email);
  return (
    sessions
      .filter((session) => session.status === "active")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0] ?? null
  );
};

/** Most recent session regardless of status — for resume diagnostics. */
export const getLatestConversationForUser = async (
  userId: string,
  email?: string | null
): Promise<ConversationSession | null> => {
  const sessions = await listConversationSessionsForUser(userId, email);
  return (
    sessions.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0] ?? null
  );
};

const listConversationSessionsForUser = async (
  userId: string,
  email?: string | null
): Promise<ConversationSession[]> => {
  const userKey = resolveStorageUserKey(userId, email);
  const prefix = buildConversationUserPrefix(userKey);

  if (getIntakeStorageMode() === "local") {
    const keys = (await listLocalConversationKeys()).filter((key) =>
      key.startsWith(prefix)
    );
    return (
      await Promise.all(keys.map((key) => readLocalSession(key)))
    ).filter((session): session is ConversationSession => session !== null);
  }

  const keys = (await listS3ObjectKeysWithPrefix(prefix)).filter((key) =>
    key.endsWith("/conversation.json")
  );
  const sessions: ConversationSession[] = [];
  for (const key of keys) {
    const raw = await readS3ObjectJson<ConversationSession>(key);
    if (raw) sessions.push(normalizeSession(raw, key));
  }
  return sessions;
};

export const abandonActiveConversations = async (
  userId: string,
  email?: string | null
): Promise<void> => {
  const sessions = await listConversationSessionsForUser(userId, email);
  const activeSessions = sessions.filter((session) => session.status === "active");
  await Promise.all(
    activeSessions.map((session) =>
      saveConversationSession({
        ...session,
        status: "completed",
        updatedAt: new Date().toISOString(),
      })
    )
  );
};

/** Reopen a completed session for continued testing or member follow-up. */
export const reopenConversationForUser = async (
  userId: string,
  email?: string | null,
  sessionId?: string
): Promise<ConversationSession> => {
  const sessions = await listConversationSessionsForUser(userId, email);
  if (sessions.length === 0) {
    throw new Error("No conversation sessions found for this member");
  }

  const target = sessionId
    ? sessions.find((session) => session.id === sessionId)
    : sessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

  if (!target) {
    throw new Error(sessionId ? "Conversation session not found" : "No conversation to reopen");
  }

  const otherActive = sessions.filter(
    (session) => session.status === "active" && session.id !== target.id
  );
  await Promise.all(
    otherActive.map((session) =>
      saveConversationSession({
        ...session,
        status: "completed",
        updatedAt: new Date().toISOString(),
      })
    )
  );

  return saveConversationSession({
    ...target,
    status: "active",
    updatedAt: new Date().toISOString(),
  });
};

export { listConversationSessionsForUser };
