import { clientsCrmStorageConfig } from "@/lib/clients/config";

const CLIENTS_SEGMENT = "clients/";
const INDEX_SEGMENT = "index/";

export const sanitizeClientSegment = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-z0-9._@-]+/g, "_").slice(0, 128);
};

/** Stable lookup key for an email address (used by the by_email index). */
export const normalizeEmailKey = (email: string): string =>
  sanitizeClientSegment(email.trim().toLowerCase());

/** Deployment-scoped CRM root, e.g. `crm/dev/` or `crm/` on prod. */
export const buildClientsCrmRootPrefix = (): string =>
  clientsCrmStorageConfig.s3Prefix;

export const buildClientRootPrefix = (clientId: string): string =>
  `${buildClientsCrmRootPrefix()}${CLIENTS_SEGMENT}client_id=${sanitizeClientSegment(clientId)}/`;

export const buildClientListPrefix = (): string =>
  `${buildClientsCrmRootPrefix()}${CLIENTS_SEGMENT}`;

export const fileDatetimePartition = (date = new Date()): string => {
  const stamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `file_datetime=${stamp}Z`;
};

export const buildClientArtifactKey = (
  clientId: string,
  category: string,
  filename: string,
  date = new Date()
): string =>
  `${buildClientRootPrefix(clientId)}${category.replace(/^\/|\/$/g, "")}/${fileDatetimePartition(date)}/${filename}`;

export const parseClientIdFromKey = (key: string): string | null => {
  const match = key.match(/clients\/client_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const buildClientByLeadIndexKey = (leadId: string): string =>
  `${buildClientsCrmRootPrefix()}${INDEX_SEGMENT}by_lead/${sanitizeClientSegment(leadId)}.json`;

export const buildClientByEmailIndexKey = (email: string): string =>
  `${buildClientsCrmRootPrefix()}${INDEX_SEGMENT}by_email/${normalizeEmailKey(email)}.json`;

export const CLIENT_PROFILE_FILENAME = "client.json";
export const CLIENT_NOTE_FILENAME = "note.json";
export const CLIENT_COMM_FILENAME = "comm.json";

/** Index payload stored at by_lead / by_email keys. */
export interface ClientIndexEntry {
  clientId: string;
}
