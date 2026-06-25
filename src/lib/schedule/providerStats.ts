import { listProviders } from "@/lib/providers/storage";
import {
  engagementRef,
  loadAllScheduleArtifacts,
} from "@/lib/schedule/artifactLoader";
import type { ProviderStats } from "@/types/provider";

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
  const [providers, artifacts] = await Promise.all([
    listProviders({ includeArchived: true }),
    loadAllScheduleArtifacts(),
  ]);

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

  for (const engagement of artifacts.engagements) {
    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const isYtd = engagement.scheduleYear === year;
    const packages =
      artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];

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
        ref,
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
