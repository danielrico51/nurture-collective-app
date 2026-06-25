import { matchProviderByLabel } from "@/lib/providers/matching";
import type { ProviderRecord } from "@/types/provider";

/** Spreadsheet shorthand → roster displayName (best guess from active provider list). */
export const BIRTH_DOULA_LABEL_ALIASES: Record<string, string> = {
  beth: "Beth L. Stein",
  janna: "Janna L. Goodman",
  brittany: "Brittany Longo",
  carrabs: "Lauren A Carrabs",
  carrab: "Lauren A Carrabs",
  "lauren c": "Lauren A Carrabs",
  "l.carrabs": "Lauren A Carrabs",
  "lauren s": "Lauren A Carrabs",
  lt: "Lauren G. Tyler",
  "lauren t": "Lauren G. Tyler",
  megan: "Megan E Flaherty",
  "megan birth": "Megan E Flaherty",
  lamden: "Leslie Lamden",
  "leslie lamden": "Leslie Lamden",
  nikki: "Nikki Flammia",
  susan: "Susan A Sykes",
  afshan: "Afshan Abbasi",
  kristina: "Kristina Victoratos",
  paulicelli: "Nicole Paulicelli",
  nicole: "Nicole Paulicelli",
  schotz: "Sharon Scheibenpflug",
  "l. schotz": "Sharon Scheibenpflug",
  "sharon scheibenpflug": "Sharon Scheibenpflug",
  clarissa: "Clarissa M Alves",
  rachel: "Rachel Lopez",
  renee: "Renee Aviv",
  laura: "Laura M Zamorski",
  szilvia: "Szilvia Galicia",
  marissa: "Marissa Scanapieco",
  amanda: "Amanda R. Trotta",
  barbara: "Barbara A. Salio",
  christine: "Christine G Fitzgerald",
  leslie: "Leslie D Peterson-Cohen",
};

const normalizeKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const firstToken = (label: string): string =>
  label.split(/[/,&+]/)[0]?.trim() ?? label;

const firstNameMatch = (
  label: string,
  providers: ProviderRecord[]
): ProviderRecord | null => {
  const token = normalizeKey(firstToken(label));
  if (!token) return null;

  for (const provider of providers) {
    const names = [provider.displayName, ...provider.aliases];
    for (const name of names) {
      const first = normalizeKey(name.split(/\s+/)[0] ?? "");
      if (first && first === token) return provider;
    }
  }
  return null;
};

export interface DoulaMatchResult {
  provider: ProviderRecord | null;
  label: string;
  matchedVia: "alias" | "exact" | "first_name" | "unmatched";
  canonicalName: string | null;
}

export const resolveDoulaLabel = (rawLabel: string): string => {
  const trimmed = rawLabel.trim();
  if (!trimmed) return trimmed;
  const key = normalizeKey(firstToken(trimmed));
  return BIRTH_DOULA_LABEL_ALIASES[key] ?? trimmed;
};

export const matchDoulaProvider = (
  rawLabel: string,
  providers: ProviderRecord[]
): DoulaMatchResult => {
  const label = rawLabel.trim();
  if (!label || /^no qb$/i.test(label)) {
    return {
      provider: null,
      label,
      matchedVia: "unmatched",
      canonicalName: null,
    };
  }

  const canonical = resolveDoulaLabel(label);
  const aliasKey = normalizeKey(firstToken(label));
  if (BIRTH_DOULA_LABEL_ALIASES[aliasKey]) {
    const byCanonical = matchProviderByLabel(canonical, providers);
    if (byCanonical) {
      return {
        provider: byCanonical,
        label,
        matchedVia: "alias",
        canonicalName: canonical,
      };
    }
  }

  const exact = matchProviderByLabel(label, providers);
  if (exact) {
    return {
      provider: exact,
      label,
      matchedVia: "exact",
      canonicalName: exact.displayName,
    };
  }

  const byCanonical = matchProviderByLabel(canonical, providers);
  if (byCanonical) {
    return {
      provider: byCanonical,
      label,
      matchedVia: "alias",
      canonicalName: canonical,
    };
  }

  const byFirst = firstNameMatch(label, providers);
  if (byFirst) {
    return {
      provider: byFirst,
      label,
      matchedVia: "first_name",
      canonicalName: byFirst.displayName,
    };
  }

  return {
    provider: null,
    label,
    matchedVia: "unmatched",
    canonicalName: canonical !== label ? canonical : null,
  };
};
