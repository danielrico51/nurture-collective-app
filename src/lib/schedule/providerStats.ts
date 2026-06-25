import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalKeys, readLocalJson } from "@/lib/clients/localStorage";
import {
  listClientsKeys,
  readClientsJson,
} from "@/lib/clients/platformS3";
import { listClients } from "@/lib/clients/storage";
import { listProviders } from "@/lib/providers/storage";
import { listPayoutsForEngagement } from "@/lib/schedule/payoutStorage";
import {
  buildEngagementListPrefix,
  buildPackageListPrefix,
  parseEngagementIdFromKey,
} from "@/lib/schedule/paths";
import type { ProviderStats } from "@/types/provider";
import type { EngagementPackage, ServiceEngagement } from "@/types/serviceEngagement";

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

const emptyStats = (providerId: string): ProviderStats => ({
  providerId,
  engagementCount: 0,
  primaryEngagementCount: 0,
  lifetimeClientFeeCents: 0,
  lifetimeDoulaPayoutCents: 0,
  ytdEngagementCount: 0,
  ytdClientFeeCents: 0,
  ytdDoulaPayoutCents: 0,
});

const listPackagesForEngagement = async (
  clientId: string,
  engagementId: string
): Promise<EngagementPackage[]> => {
  const prefix = buildPackageListPrefix(clientId, engagementId);
  const keys = (await listKeys(prefix)).filter((key) => key.endsWith("/package.json"));
  const packages: EngagementPackage[] = [];
  for (const key of keys) {
    const record = await readJson<EngagementPackage>(key);
    if (record) packages.push(record);
  }
  return packages;
};

const isYtdEngagement = (
  engagement: ServiceEngagement,
  year: number
): boolean => engagement.scheduleYear === year;

type MutableStats = ProviderStats & {
  engagementKeys: Set<string>;
  ytdEngagementKeys: Set<string>;
};

const ensureStats = (
  map: Map<string, MutableStats>,
  providerId: string
): MutableStats => {
  const existing = map.get(providerId);
  if (existing) return existing;
  const created: MutableStats = {
    ...emptyStats(providerId),
    engagementKeys: new Set<string>(),
    ytdEngagementKeys: new Set<string>(),
  };
  map.set(providerId, created);
  return created;
};

const trackEngagement = (
  stats: MutableStats,
  engagementKey: string,
  isYtd: boolean,
  isPrimary: boolean
): void => {
  const isNewEngagement = !stats.engagementKeys.has(engagementKey);
  if (isNewEngagement) {
    stats.engagementKeys.add(engagementKey);
    stats.engagementCount += 1;
    if (isPrimary) {
      stats.primaryEngagementCount += 1;
    }
  }

  if (isYtd && !stats.ytdEngagementKeys.has(engagementKey)) {
    stats.ytdEngagementKeys.add(engagementKey);
    stats.ytdEngagementCount += 1;
  }
};

export const computeAllProviderStats = async (
  year = new Date().getFullYear()
): Promise<Record<string, ProviderStats>> => {
  const providers = await listProviders({ includeArchived: true });
  const statsMap = new Map<string, MutableStats>(
    providers.map((provider) => [
      provider.providerId,
      {
        ...emptyStats(provider.providerId),
        engagementKeys: new Set<string>(),
        ytdEngagementKeys: new Set<string>(),
      },
    ])
  );

  const clients = await listClients();

  for (const client of clients) {
    const prefix = buildEngagementListPrefix(client.clientId);
    const engagementKeys = (await listKeys(prefix)).filter((key) =>
      key.endsWith("/engagement.json")
    );

    for (const engagementKey of engagementKeys) {
      const engagementId = parseEngagementIdFromKey(engagementKey);
      if (!engagementId) continue;

      const engagement = await readJson<ServiceEngagement>(engagementKey);
      if (!engagement) continue;

      const engagementRef = `${client.clientId}:${engagementId}`;
      const isYtd = isYtdEngagement(engagement, year);
      const packages = await listPackagesForEngagement(client.clientId, engagementId);
      const payouts = await listPayoutsForEngagement(client.clientId, engagementId);

      const providersOnEngagement = new Set<string>();
      if (engagement.primaryProviderId) {
        providersOnEngagement.add(engagement.primaryProviderId);
      }
      for (const pkg of packages) {
        if (pkg.providerId) providersOnEngagement.add(pkg.providerId);
      }
      for (const payout of payouts) {
        providersOnEngagement.add(payout.providerId);
      }

      for (const providerId of Array.from(providersOnEngagement)) {
        const stats = ensureStats(statsMap, providerId);
        trackEngagement(
          stats,
          engagementRef,
          isYtd,
          engagement.primaryProviderId === providerId
        );
      }

      for (const pkg of packages) {
        if (!pkg.providerId) continue;
        const stats = ensureStats(statsMap, pkg.providerId);
        stats.lifetimeClientFeeCents += pkg.clientFeeCents;
        if (isYtd) {
          stats.ytdClientFeeCents += pkg.clientFeeCents;
        }
      }

      for (const payout of payouts) {
        const stats = ensureStats(statsMap, payout.providerId);
        stats.lifetimeDoulaPayoutCents += payout.amountCents;
        if (isYtd) {
          stats.ytdDoulaPayoutCents += payout.amountCents;
        }
      }
    }
  }

  const result: Record<string, ProviderStats> = {};
  for (const [providerId, stats] of Array.from(statsMap.entries())) {
    result[providerId] = {
      providerId: stats.providerId,
      engagementCount: stats.engagementCount,
      primaryEngagementCount: stats.primaryEngagementCount,
      lifetimeClientFeeCents: stats.lifetimeClientFeeCents,
      lifetimeDoulaPayoutCents: stats.lifetimeDoulaPayoutCents,
      ytdEngagementCount: stats.ytdEngagementCount,
      ytdClientFeeCents: stats.ytdClientFeeCents,
      ytdDoulaPayoutCents: stats.ytdDoulaPayoutCents,
    };
  }

  return result;
};

export const getProviderStats = async (
  providerId: string,
  year = new Date().getFullYear()
): Promise<ProviderStats> => {
  const all = await computeAllProviderStats(year);
  return all[providerId] ?? emptyStats(providerId);
};
