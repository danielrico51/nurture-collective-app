import { normalizePhone } from "@/lib/intake/submitService";
import { normalizeMatchKey } from "@/lib/providers/matching";
import type { ProviderRecord } from "@/types/provider";

export type ProviderMatchTier =
  | "override"
  | "exact"
  | "initials"
  | "first_last"
  | "phone";

export interface ProviderUnifyOverride {
  prodProviderId: string;
  devProviderId: string;
  note?: string;
}

export interface ProviderUnifyOverrides {
  matches?: ProviderUnifyOverride[];
}

export interface ProviderMatchPair {
  prod: ProviderRecord;
  dev: ProviderRecord;
  tier: ProviderMatchTier;
}

export interface ProviderMatchAmbiguity {
  reason: string;
  prod?: ProviderRecord;
  dev?: ProviderRecord;
  prodCandidates: ProviderRecord[];
  devCandidates: ProviderRecord[];
}

export interface ProviderMatchAudit {
  matched: ProviderMatchPair[];
  prodOnly: ProviderRecord[];
  devOnly: ProviderRecord[];
  ambiguous: ProviderMatchAmbiguity[];
  blocked: boolean;
}

const phoneKey = (phone: string | undefined | null): string | null => {
  const normalized = normalizePhone(phone ?? "");
  return normalized || null;
};

export const normalizeIgnoringInitialPunctuation = (value: string): string =>
  normalizeMatchKey(value)
    .replace(/\b([a-z])\.?\s+/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();

export const firstLastKey = (value: string): string | null => {
  const tokens = normalizeMatchKey(value).split(" ").filter(Boolean);
  if (tokens.length < 2) return null;
  return `${tokens[0]} ${tokens[tokens.length - 1]}`;
};

const collectNameKeys = (
  provider: ProviderRecord
): Map<string, ProviderMatchTier> => {
  const keys = new Map<string, ProviderMatchTier>();
  const names = [provider.displayName, ...provider.aliases];

  for (const name of names) {
    const exact = normalizeMatchKey(name);
    if (exact) keys.set(`exact:${exact}`, "exact");

    const initials = normalizeIgnoringInitialPunctuation(name);
    if (initials) keys.set(`initials:${initials}`, "initials");

    const firstLast = firstLastKey(name);
    if (firstLast) keys.set(`first_last:${firstLast}`, "first_last");
  }

  const phone = phoneKey(provider.phone);
  if (phone) keys.set(`phone:${phone}`, "phone");

  return keys;
};

const tierRank = (tier: ProviderMatchTier): number => {
  switch (tier) {
    case "override":
      return 0;
    case "exact":
      return 1;
    case "initials":
      return 2;
    case "first_last":
      return 3;
    case "phone":
      return 4;
    default:
      return 99;
  }
};

const findBestTierMatch = (
  prod: ProviderRecord,
  devCandidates: ProviderRecord[]
): { dev: ProviderRecord; tier: ProviderMatchTier } | null => {
  const prodKeys = collectNameKeys(prod);
  let best: { dev: ProviderRecord; tier: ProviderMatchTier } | null = null;

  for (const dev of devCandidates) {
    const devKeys = collectNameKeys(dev);
    for (const [key, tier] of Array.from(prodKeys.entries())) {
      if (!devKeys.has(key)) continue;
      const devTier = devKeys.get(key)!;
      const resolvedTier =
        tierRank(tier) <= tierRank(devTier) ? tier : devTier;
      if (
        !best ||
        tierRank(resolvedTier) < tierRank(best.tier) ||
        (resolvedTier === best.tier &&
          dev.displayName.localeCompare(best.dev.displayName, undefined, {
            sensitivity: "base",
          }) < 0)
      ) {
        best = { dev, tier: resolvedTier };
      }
    }
  }

  return best;
};

export const auditProviderUnification = (
  prodProviders: ProviderRecord[],
  devProviders: ProviderRecord[],
  overrides: ProviderUnifyOverrides = {}
): ProviderMatchAudit => {
  const matched: ProviderMatchPair[] = [];
  const ambiguous: ProviderMatchAmbiguity[] = [];
  const usedProdIds = new Set<string>();
  const usedDevIds = new Set<string>();

  const prodById = new Map(
    prodProviders.map((provider) => [provider.providerId, provider])
  );
  const devById = new Map(
    devProviders.map((provider) => [provider.providerId, provider])
  );

  for (const override of overrides.matches ?? []) {
    const prod = prodById.get(override.prodProviderId);
    const dev = devById.get(override.devProviderId);
    if (!prod || !dev) {
      ambiguous.push({
        reason: override.note ?? "Override references missing provider",
        prod,
        dev,
        prodCandidates: prod ? [prod] : [],
        devCandidates: dev ? [dev] : [],
      });
      continue;
    }
    if (usedProdIds.has(prod.providerId) || usedDevIds.has(dev.providerId)) {
      ambiguous.push({
        reason: "Override conflicts with an existing match",
        prod,
        dev,
        prodCandidates: [prod],
        devCandidates: [dev],
      });
      continue;
    }
    usedProdIds.add(prod.providerId);
    usedDevIds.add(dev.providerId);
    matched.push({ prod, dev, tier: "override" });
  }

  const remainingProd = prodProviders.filter(
    (provider) => !usedProdIds.has(provider.providerId)
  );
  const remainingDev = devProviders.filter(
    (provider) => !usedDevIds.has(provider.providerId)
  );

  for (const prod of remainingProd) {
    const candidates: ProviderRecord[] = [];
    const prodKeys = collectNameKeys(prod);

    for (const dev of remainingDev) {
      if (usedDevIds.has(dev.providerId)) continue;
      const devKeys = collectNameKeys(dev);
      const hasMatch = Array.from(prodKeys.keys()).some((key) =>
        devKeys.has(key)
      );
      if (hasMatch) candidates.push(dev);
    }

    if (candidates.length === 0) continue;

    const best = findBestTierMatch(prod, candidates);
    if (!best) continue;

    const tied = candidates.filter((dev) => {
      const match = findBestTierMatch(prod, [dev]);
      return match?.tier === best.tier && match.dev.providerId !== best.dev.providerId;
    });

    if (tied.length > 0) {
      ambiguous.push({
        reason: `Multiple dev providers match ${prod.displayName}`,
        prod,
        prodCandidates: [prod],
        devCandidates: [best.dev, ...tied],
      });
      continue;
    }

    usedProdIds.add(prod.providerId);
    usedDevIds.add(best.dev.providerId);
    matched.push({ prod, dev: best.dev, tier: best.tier });
  }

  const prodOnly = prodProviders.filter(
    (provider) => !usedProdIds.has(provider.providerId)
  );
  const devOnly = devProviders.filter(
    (provider) => !usedDevIds.has(provider.providerId)
  );

  return {
    matched,
    prodOnly,
    devOnly,
    ambiguous,
    blocked: ambiguous.length > 0,
  };
};

export const mergeProviderAliases = (
  prod: ProviderRecord,
  dev: ProviderRecord
): string[] => {
  const names = new Set<string>();
  for (const name of [
    prod.displayName,
    ...prod.aliases,
    dev.displayName,
    ...dev.aliases,
  ]) {
    const trimmed = name.trim();
    if (trimmed) names.add(trimmed);
  }
  return Array.from(names).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
};
