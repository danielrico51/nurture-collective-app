const LEADS_PREFIX = "leads/";

export const sanitizeLeadSegment = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "unknown";
  return trimmed.replace(/[^a-z0-9._@-]+/g, "_").slice(0, 128);
};

export const buildLeadRootPrefix = (leadId: string): string =>
  `${LEADS_PREFIX}lead_id=${sanitizeLeadSegment(leadId)}/`;

export const buildLeadListPrefix = (): string => LEADS_PREFIX;

export const fileDatetimePartition = (date = new Date()): string => {
  const stamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `file_datetime=${stamp}Z`;
};

export const buildLeadArtifactKey = (
  leadId: string,
  category: string,
  filename: string,
  date = new Date()
): string =>
  `${buildLeadRootPrefix(leadId)}${category.replace(/^\/|\/$/g, "")}/${fileDatetimePartition(date)}/${filename}`;

export const parseLeadIdFromKey = (key: string): string | null => {
  const match = key.match(/^leads\/lead_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const LEAD_PROFILE_FILENAME = "lead_profile.json";
export const LEAD_NOTE_FILENAME = "note.json";
