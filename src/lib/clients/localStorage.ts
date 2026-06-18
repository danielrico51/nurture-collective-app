import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import { clientsCrmStorageConfig } from "@/lib/clients/config";
import {
  buildClientArtifactKey,
  buildClientByEmailIndexKey,
  buildClientByLeadIndexKey,
  buildClientListPrefix,
  buildClientRootPrefix,
  CLIENT_COMM_FILENAME,
  CLIENT_NOTE_FILENAME,
  CLIENT_PROFILE_FILENAME,
  parseClientIdFromKey,
  type ClientIndexEntry,
} from "@/lib/clients/paths";
import type {
  ClientCommunication,
  ClientNote,
  ClientRecord,
} from "@/types/client";

const LOCAL_ROOT = clientsCrmStorageConfig.localDataRoot;

const localPath = (key: string) => path.join(LOCAL_ROOT, key);

const walkKeys = async (
  dir: string,
  prefix: string,
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

export const writeLocalJson = async (
  key: string,
  payload: unknown
): Promise<void> => {
  const full = localPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(payload, null, 2), "utf8");
};

export const listLocalKeys = async (
  prefix = buildClientListPrefix()
): Promise<string[]> => {
  const keys: string[] = [];
  await walkKeys(localPath(prefix), prefix, keys);
  return keys;
};

export const deleteLocalJson = async (key: string): Promise<void> => {
  try {
    await rm(localPath(key));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return;
    throw error;
  }
};

export const appendLocalClientProfile = async (
  client: ClientRecord
): Promise<string> => {
  const key = buildClientArtifactKey(
    client.clientId,
    "profile",
    CLIENT_PROFILE_FILENAME
  );
  await writeLocalJson(key, { ...client, storageKey: key });
  return key;
};

export const appendLocalClientNote = async (
  note: ClientNote
): Promise<string> => {
  const key = buildClientArtifactKey(
    note.clientId,
    "notes",
    CLIENT_NOTE_FILENAME
  );
  await writeLocalJson(key, { ...note, storageKey: key });
  return key;
};

export const appendLocalClientCommunication = async (
  comm: ClientCommunication
): Promise<string> => {
  const key = buildClientArtifactKey(
    comm.clientId,
    "communications",
    CLIENT_COMM_FILENAME
  );
  await writeLocalJson(key, { ...comm, storageKey: key });
  return key;
};

export const listLocalClientIds = async (): Promise<string[]> => {
  const keys = await listLocalKeys();
  const ids = new Set<string>();
  for (const key of keys) {
    const id = parseClientIdFromKey(key);
    if (id) ids.add(id);
  }
  return Array.from(ids);
};

export const getLatestLocalClientProfile = async (
  clientId: string
): Promise<ClientRecord | null> => {
  const prefix = `${buildClientRootPrefix(clientId)}profile/`;
  const keys = (await listLocalKeys(prefix))
    .filter((key) => key.endsWith(`/${CLIENT_PROFILE_FILENAME}`))
    .sort()
    .reverse();
  for (const key of keys) {
    const record = await readLocalJson<ClientRecord>(key);
    if (record) return { ...record, storageKey: key };
  }
  return null;
};

export const listLocalNotesForClient = async (
  clientId: string
): Promise<ClientNote[]> => {
  const prefix = `${buildClientRootPrefix(clientId)}notes/`;
  const keys = (await listLocalKeys(prefix))
    .filter((key) => key.endsWith(`/${CLIENT_NOTE_FILENAME}`))
    .sort()
    .reverse();
  const notes: ClientNote[] = [];
  for (const key of keys) {
    const note = await readLocalJson<ClientNote>(key);
    if (note) notes.push({ ...note, storageKey: key });
  }
  return notes;
};

export const listLocalCommunicationsForClient = async (
  clientId: string
): Promise<ClientCommunication[]> => {
  const prefix = `${buildClientRootPrefix(clientId)}communications/`;
  const keys = (await listLocalKeys(prefix))
    .filter((key) => key.endsWith(`/${CLIENT_COMM_FILENAME}`))
    .sort()
    .reverse();
  const comms: ClientCommunication[] = [];
  for (const key of keys) {
    const comm = await readLocalJson<ClientCommunication>(key);
    if (comm) comms.push({ ...comm, storageKey: key });
  }
  return comms;
};

export const writeLocalClientLeadIndex = async (
  leadId: string,
  clientId: string
): Promise<void> => {
  await writeLocalJson(buildClientByLeadIndexKey(leadId), { clientId });
};

export const writeLocalClientEmailIndex = async (
  email: string,
  clientId: string
): Promise<void> => {
  await writeLocalJson(buildClientByEmailIndexKey(email), { clientId });
};

export const readLocalClientLeadIndex = async (
  leadId: string
): Promise<string | null> => {
  const entry = await readLocalJson<ClientIndexEntry>(
    buildClientByLeadIndexKey(leadId)
  );
  return entry?.clientId ?? null;
};

export const readLocalClientEmailIndex = async (
  email: string
): Promise<string | null> => {
  const entry = await readLocalJson<ClientIndexEntry>(
    buildClientByEmailIndexKey(email)
  );
  return entry?.clientId ?? null;
};
