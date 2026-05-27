import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import {
  buildLeadArtifactKey,
  buildLeadListPrefix,
  buildLeadRootPrefix,
  LEAD_NOTE_FILENAME,
  LEAD_PROFILE_FILENAME,
  parseLeadIdFromKey,
} from "@/lib/leads/paths";
import type { CoordinatorNote, LeadRecord } from "@/types/lead";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "nurture-leads");

const localPath = (key: string) => path.join(LOCAL_ROOT, key);

const walkKeys = async (dir: string, prefix: string, keys: string[]): Promise<void> => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const relative = `${prefix}${entry.name}`;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkKeys(full, `${relative}/`, keys);
    } else {
      keys.push(relative);
    }
  }
};

export const readLocalJson = async <T>(key: string): Promise<T | null> => {
  try {
    const body = await readFile(localPath(key), "utf8");
    return JSON.parse(body) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw error;
  }
};

export const writeLocalJson = async (key: string, payload: unknown): Promise<void> => {
  const full = localPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(payload, null, 2), "utf8");
};

export const listLocalKeys = async (prefix = buildLeadListPrefix()): Promise<string[]> => {
  const keys: string[] = [];
  await walkKeys(localPath(prefix), prefix, keys);
  return keys;
};

export const appendLocalLeadProfile = async (lead: LeadRecord): Promise<string> => {
  const key = buildLeadArtifactKey(lead.leadId, "profile", LEAD_PROFILE_FILENAME);
  await writeLocalJson(key, { ...lead, storageKey: key });
  return key;
};

export const appendLocalCoordinatorNote = async (
  note: CoordinatorNote
): Promise<string> => {
  const key = buildLeadArtifactKey(note.leadId, "coordinator_notes", LEAD_NOTE_FILENAME);
  await writeLocalJson(key, { ...note, storageKey: key });
  return key;
};

export const listLocalLeadIds = async (): Promise<string[]> => {
  const keys = await listLocalKeys();
  const ids = new Set<string>();
  for (const key of keys) {
    const id = parseLeadIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

export const getLatestLocalLeadProfile = async (
  leadId: string
): Promise<LeadRecord | null> => {
  const prefix = `${buildLeadRootPrefix(leadId)}profile/`;
  const keys = (await listLocalKeys(prefix))
    .filter((key) => key.endsWith(`/${LEAD_PROFILE_FILENAME}`))
    .sort()
    .reverse();
  for (const key of keys) {
    const record = await readLocalJson<LeadRecord>(key);
    if (record) return { ...record, storageKey: key };
  }
  return null;
};

export const listLocalNotesForLead = async (
  leadId: string
): Promise<CoordinatorNote[]> => {
  const prefix = `${buildLeadRootPrefix(leadId)}coordinator_notes/`;
  const keys = (await listLocalKeys(prefix))
    .filter((key) => key.endsWith(`/${LEAD_NOTE_FILENAME}`))
    .sort()
    .reverse();
  const notes: CoordinatorNote[] = [];
  for (const key of keys) {
    const note = await readLocalJson<CoordinatorNote>(key);
    if (note) notes.push({ ...note, storageKey: key });
  }
  return notes;
};
