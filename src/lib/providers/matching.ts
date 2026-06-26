import type { ProviderRecord } from "@/types/provider";

const normalizeMatchKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export { normalizeMatchKey };

export const matchProviderByLabel = (
  label: string,
  providers: ProviderRecord[]
): ProviderRecord | null => {
  const key = normalizeMatchKey(label);
  if (!key) return null;

  for (const provider of providers) {
    const candidates = [provider.displayName, ...provider.aliases];
    for (const candidate of candidates) {
      if (normalizeMatchKey(candidate) === key) {
        return provider;
      }
    }
  }

  return null;
};

export const collectUniqueProviderLabels = (labels: string[]): string[] => {
  const seen = new Map<string, string>();
  for (const label of labels) {
    const trimmed = label.trim();
    if (!trimmed) continue;
    if (/^\d/.test(trimmed)) continue;
    if (/^\$/.test(trimmed)) continue;
    if (/^(cc|tnp credit|refund|n\/c|asap)$/i.test(trimmed)) continue;
    const key = normalizeMatchKey(trimmed);
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
};
