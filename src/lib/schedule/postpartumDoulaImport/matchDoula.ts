import {
  BIRTH_DOULA_LABEL_ALIASES,
  matchDoulaProvider as matchBirthDoulaProvider,
  resolveDoulaLabel as resolveBirthDoulaLabel,
  type DoulaMatchResult,
} from "@/lib/schedule/birthDoulaImport/matchDoula";
import { matchProviderByLabel } from "@/lib/providers/matching";
import type { ProviderRecord } from "@/types/provider";

/** Postpartum-specific spreadsheet shorthand → roster displayName. */
export const POSTPARTUM_DOULA_LABEL_ALIASES: Record<string, string> = {
  ...BIRTH_DOULA_LABEL_ALIASES,
  alison: "Alison Herman",
  joanna: "Joanna",
  judy: "Judy",
  sandra: "Sandra",
  kelley: "Kelley",
  kelsey: "Kelsey",
  paula: "Paula",
  jill: "Jill",
  hannah: "Hannah",
  angela: "Angela",
  charlie: "Charlie",
  suzanne: "Suzanne",
  adriana: "Adriana",
  melanie: "Melanie",
  krista: "Krista",
  kate: "Kate",
  longo: "Brittany Longo",
  linda: "Linda Steinhauser",
  ll: "Lauren G. Tyler",
  lz: "Laura M Zamorski",
  "lz/ll": "Laura M Zamorski",
  "ll/mb": "Lauren G. Tyler",
  "ll/mc": "Lauren A Carrabs",
  "so/sf": "Sharon Scheibenpflug",
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

export const resolvePostpartumDoulaLabel = (rawLabel: string): string => {
  const trimmed = rawLabel.trim();
  if (!trimmed) return trimmed;
  const key = normalizeKey(firstToken(trimmed));
  return POSTPARTUM_DOULA_LABEL_ALIASES[key] ?? resolveBirthDoulaLabel(trimmed);
};

export const matchPostpartumDoulaProvider = (
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

  const canonical = resolvePostpartumDoulaLabel(label);
  const aliasKey = normalizeKey(firstToken(label));
  if (POSTPARTUM_DOULA_LABEL_ALIASES[aliasKey]) {
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

  const birthMatch = matchBirthDoulaProvider(label, providers);
  if (birthMatch.provider) {
    return birthMatch;
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

export type { DoulaMatchResult };
