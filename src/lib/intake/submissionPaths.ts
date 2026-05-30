const sanitizeLeadId = (leadId: string): string =>
  leadId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 128);

export const buildHistoricalIntakeKey = (
  leadId: string,
  date = new Date()
): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  return `leads/year=${year}/month=${month}/day=${day}/lead_id=${sanitizeLeadId(leadId)}/${timestamp}.json`;
};

export const buildDeadLetterIntakeKey = (
  leadId: string,
  reason: string,
  date = new Date()
): string => {
  const stamp = date.toISOString().replace(/[:.]/g, "-");
  const safeReason = reason.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 48);
  return `leads/dead-letter/lead_id=${sanitizeLeadId(leadId)}/${stamp}_${safeReason}.json`;
};
