import { getClientsStorageMode } from "@/lib/clients/config";
import {
  engagementRef,
  invalidateCrmStorageIndexCache,
  loadAllScheduleArtifacts,
} from "@/lib/clients/crmIndexLoader";
import {
  deleteLocalJson,
  listLocalKeys,
  readLocalJson,
} from "@/lib/clients/localStorage";
import {
  deleteClientsJson,
  listClientsKeys,
  readClientsJson,
} from "@/lib/clients/platformS3";
import { rebuildDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { deleteProvider, listProviders } from "@/lib/providers/storage";
import { computeAllProviderStats } from "@/lib/schedule/providerStats";
import {
  buildExpectationKey,
  buildExpectationListPrefix,
  buildPackageKey,
  parseExpectationIdFromKey,
} from "@/lib/schedule/paths";
import {
  updateEngagementPackage,
  updateServiceEngagement,
} from "@/lib/schedule/storage";
import type { ProviderRecord, ProviderStats } from "@/types/provider";
import type {
  ClientPaymentExpectation,
  EngagementPackage,
  ProviderPayoutBatch,
  ServiceEngagement,
} from "@/types/serviceEngagement";

export interface ProviderCleanupReport {
  engagementsAudited: number;
  engagementsMissingPrimary: number;
  engagementsFixedPrimary: number;
  packagesMissingProvider: number;
  packagesFixedProvider: number;
  junkPackagesRemoved: number;
  providersTotal: number;
  providersWithRevenue: number;
  providersDeleted: number;
  deletedProviders: Array<{ providerId: string; displayName: string }>;
  unfixedEngagements: Array<{
    clientId: string;
    engagementId: string;
    serviceType: string;
    scheduleYear: number;
  }>;
  zeroRevenueProviders: Array<{
    providerId: string;
    displayName: string;
    engagementCount: number;
  }>;
}

const SCHEDULE_SERVICE_TYPES = new Set(["birth", "postpartum"]);

const listKeys = async (prefix: string): Promise<string[]> =>
  getClientsStorageMode() === "local"
    ? listLocalKeys(prefix)
    : listClientsKeys(prefix);

const deleteJson = async (key: string): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await deleteLocalJson(key);
  } else {
    await deleteClientsJson(key);
  }
};

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

export const providerHasRevenue = (stats: ProviderStats): boolean =>
  stats.lifetimeClientFeeCents > 0 || stats.lifetimeDoulaPayoutCents > 0;

const pickMostLikelyProviderId = (
  packages: EngagementPackage[],
  payouts: ProviderPayoutBatch[]
): string | null => {
  const scores = new Map<string, number>();

  const add = (providerId: string | null, weight: number): void => {
    if (!providerId) return;
    scores.set(providerId, (scores.get(providerId) ?? 0) + weight);
  };

  for (const pkg of packages) {
    add(pkg.providerId, pkg.clientFeeCents > 0 ? 3 : 1);
  }
  for (const payout of payouts) {
    add(payout.providerId, payout.amountCents > 0 ? 2 : 1);
  }

  if (scores.size === 0) return null;

  return Array.from(scores.entries()).sort((a, b) => b[1] - a[1])[0][0];
};

const isScheduleEngagement = (engagement: ServiceEngagement): boolean =>
  SCHEDULE_SERVICE_TYPES.has(engagement.serviceType);

/** Spreadsheet import noise: $0 add-on rows tied to mislabeled provider names. */
export const isJunkImportPackage = (
  pkg: EngagementPackage,
  providerStats: ProviderStats | undefined
): boolean => {
  if (pkg.sortOrder === 0) return false;
  if (pkg.clientFeeCents !== 0) return false;
  if ((pkg.doulaFeeCents ?? 0) !== 0) return false;
  if (!pkg.providerId) return false;
  if (!providerStats) return true;
  return !providerHasRevenue(providerStats);
};

const deleteEngagementPackage = async (
  clientId: string,
  engagementId: string,
  packageId: string
): Promise<void> => {
  const expectationPrefix = buildExpectationListPrefix(clientId, engagementId);
  const expectationKeys = (await listKeys(expectationPrefix)).filter((key) =>
    key.endsWith("/expectation.json")
  );

  for (const key of expectationKeys) {
    const expectation = await readJson<ClientPaymentExpectation>(key);
    if (!expectation || expectation.packageId !== packageId) continue;
    const expectationId = parseExpectationIdFromKey(key);
    if (!expectationId) continue;
    await deleteJson(buildExpectationKey(clientId, engagementId, expectationId));
  }

  await deleteJson(buildPackageKey(clientId, engagementId, packageId));
};

const emptyReport = (): ProviderCleanupReport => ({
  engagementsAudited: 0,
  engagementsMissingPrimary: 0,
  engagementsFixedPrimary: 0,
  packagesMissingProvider: 0,
  packagesFixedProvider: 0,
  junkPackagesRemoved: 0,
  providersTotal: 0,
  providersWithRevenue: 0,
  providersDeleted: 0,
  deletedProviders: [],
  unfixedEngagements: [],
  zeroRevenueProviders: [],
});

const fixEngagementProviders = async (
  artifacts: Awaited<ReturnType<typeof loadAllScheduleArtifacts>>,
  report: ProviderCleanupReport,
  dryRun: boolean
): Promise<void> => {
  for (const engagement of artifacts.engagements) {
    if (!isScheduleEngagement(engagement)) continue;
    report.engagementsAudited += 1;

    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];

    let primaryProviderId = engagement.primaryProviderId;

    if (!primaryProviderId) {
      report.engagementsMissingPrimary += 1;
      primaryProviderId = pickMostLikelyProviderId(packages, payouts);

      if (primaryProviderId) {
        if (!dryRun) {
          await updateServiceEngagement(
            engagement.clientId,
            engagement.engagementId,
            { primaryProviderId }
          );
        }
        report.engagementsFixedPrimary += 1;
      } else {
        report.unfixedEngagements.push({
          clientId: engagement.clientId,
          engagementId: engagement.engagementId,
          serviceType: engagement.serviceType,
          scheduleYear: engagement.scheduleYear,
        });
      }
    }

    if (!primaryProviderId) continue;

    for (const pkg of packages) {
      if (pkg.providerId) continue;
      report.packagesMissingProvider += 1;
      if (!dryRun) {
        await updateEngagementPackage(
          engagement.clientId,
          engagement.engagementId,
          pkg.packageId,
          { providerId: primaryProviderId }
        );
      }
      report.packagesFixedProvider += 1;
    }
  }
};

const removeJunkImportPackages = async (
  stats: Record<string, ProviderStats>,
  dryRun: boolean
): Promise<number> => {
  invalidateCrmStorageIndexCache();
  const artifacts = await loadAllScheduleArtifacts();
  let removed = 0;

  for (const engagement of artifacts.engagements) {
    if (!isScheduleEngagement(engagement)) continue;

    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];

    for (const pkg of packages) {
      const providerStats = pkg.providerId ? stats[pkg.providerId] : undefined;
      if (!isJunkImportPackage(pkg, providerStats)) continue;

      removed += 1;
      if (!dryRun) {
        await deleteEngagementPackage(
          engagement.clientId,
          engagement.engagementId,
          pkg.packageId
        );
      }
    }
  }

  return removed;
};

const collectJunkPackageKeys = async (
  stats: Record<string, ProviderStats>
): Promise<Set<string>> => {
  const artifacts = await loadAllScheduleArtifacts();
  const keys = new Set<string>();

  for (const engagement of artifacts.engagements) {
    if (!isScheduleEngagement(engagement)) continue;

    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];

    for (const pkg of packages) {
      const providerStats = pkg.providerId ? stats[pkg.providerId] : undefined;
      if (!isJunkImportPackage(pkg, providerStats)) continue;
      keys.add(`${ref}:${pkg.packageId}`);
    }
  }

  return keys;
};

const providerHasNonJunkReferences = (
  providerId: string,
  artifacts: Awaited<ReturnType<typeof loadAllScheduleArtifacts>>,
  junkPackageKeys: Set<string>
): boolean => {
  for (const engagement of artifacts.engagements) {
    if (engagement.primaryProviderId === providerId) return true;

    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];

    for (const pkg of packages) {
      if (pkg.providerId !== providerId) continue;
      if (!junkPackageKeys.has(`${ref}:${pkg.packageId}`)) return true;
    }

    if (payouts.some((payout) => payout.providerId === providerId)) return true;
  }
  return false;
};

const deleteZeroRevenueProviders = async (
  dryRun: boolean,
  junkPackageKeys: Set<string>,
  artifacts: Awaited<ReturnType<typeof loadAllScheduleArtifacts>>
): Promise<{
  providersTotal: number;
  providersWithRevenue: number;
  providersDeleted: number;
  deletedProviders: Array<{ providerId: string; displayName: string }>;
  zeroRevenueProviders: Array<{
    providerId: string;
    displayName: string;
    engagementCount: number;
  }>;
}> => {
  invalidateCrmStorageIndexCache();
  const [providers, stats] = await Promise.all([
    listProviders({ includeArchived: true }),
    computeAllProviderStats(),
  ]);

  const deletedProviders: Array<{ providerId: string; displayName: string }> =
    [];
  const zeroRevenueProviders: Array<{
    providerId: string;
    displayName: string;
    engagementCount: number;
  }> = [];
  let providersWithRevenue = 0;
  let providersDeleted = 0;

  for (const provider of providers) {
    const providerStats = stats[provider.providerId];
    if (!providerStats) continue;

    if (providerHasRevenue(providerStats)) {
      providersWithRevenue += 1;
      continue;
    }

    zeroRevenueProviders.push({
      providerId: provider.providerId,
      displayName: provider.displayName,
      engagementCount: providerStats.engagementCount,
    });

    if (providerStats.engagementCount > 0) {
      const hasOtherRefs = providerHasNonJunkReferences(
        provider.providerId,
        artifacts,
        junkPackageKeys
      );
      if (hasOtherRefs) continue;
    }

    if (!dryRun) {
      await deleteProvider(provider.providerId);
    }
    providersDeleted += 1;
    deletedProviders.push({
      providerId: provider.providerId,
      displayName: provider.displayName,
    });
  }

  deletedProviders.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  );
  zeroRevenueProviders.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  );

  return {
    providersTotal: providers.length,
    providersWithRevenue,
    providersDeleted,
    deletedProviders,
    zeroRevenueProviders,
  };
};

export const auditProviderCleanup = async (): Promise<{
  report: ProviderCleanupReport;
  providers: ProviderRecord[];
  stats: Record<string, ProviderStats>;
}> => {
  const [providers, artifacts, stats] = await Promise.all([
    listProviders({ includeArchived: true }),
    loadAllScheduleArtifacts(),
    computeAllProviderStats(),
  ]);

  const report = emptyReport();

  for (const engagement of artifacts.engagements) {
    if (!isScheduleEngagement(engagement)) continue;
    report.engagementsAudited += 1;

    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];

    if (!engagement.primaryProviderId) {
      report.engagementsMissingPrimary += 1;
      const inferred = pickMostLikelyProviderId(packages, payouts);
      if (!inferred) {
        report.unfixedEngagements.push({
          clientId: engagement.clientId,
          engagementId: engagement.engagementId,
          serviceType: engagement.serviceType,
          scheduleYear: engagement.scheduleYear,
        });
      }
    }

    for (const pkg of packages) {
      if (!pkg.providerId && pkg.clientFeeCents !== 0) {
        report.packagesMissingProvider += 1;
      }
      const providerStats = pkg.providerId ? stats[pkg.providerId] : undefined;
      if (isJunkImportPackage(pkg, providerStats)) {
        report.junkPackagesRemoved += 1;
      }
    }
  }

  for (const provider of providers) {
    const providerStats = stats[provider.providerId];
    if (providerStats && providerHasRevenue(providerStats)) {
      report.providersWithRevenue += 1;
    } else if (providerStats) {
      report.zeroRevenueProviders.push({
        providerId: provider.providerId,
        displayName: provider.displayName,
        engagementCount: providerStats.engagementCount,
      });
    }
  }

  report.providersTotal = providers.length;
  report.zeroRevenueProviders.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  );

  return { report, providers, stats };
};

export const runProviderCleanup = async (options?: {
  dryRun?: boolean;
  rebuildSnapshot?: boolean;
}): Promise<ProviderCleanupReport> => {
  const dryRun = options?.dryRun ?? false;
  const rebuildSnapshot = options?.rebuildSnapshot ?? !dryRun;

  const artifacts = await loadAllScheduleArtifacts();
  const report = emptyReport();

  await fixEngagementProviders(artifacts, report, dryRun);

  const stats = await computeAllProviderStats();
  const junkPackageKeys = await collectJunkPackageKeys(stats);
  report.junkPackagesRemoved = await removeJunkImportPackages(stats, dryRun);

  invalidateCrmStorageIndexCache();
  const artifactsAfterJunk = dryRun
    ? artifacts
    : await loadAllScheduleArtifacts();

  const providerSummary = await deleteZeroRevenueProviders(
    dryRun,
    junkPackageKeys,
    artifactsAfterJunk
  );
  report.providersTotal = providerSummary.providersTotal;
  report.providersWithRevenue = providerSummary.providersWithRevenue;
  report.providersDeleted = providerSummary.providersDeleted;
  report.deletedProviders = providerSummary.deletedProviders;
  report.zeroRevenueProviders = providerSummary.zeroRevenueProviders;

  if (!dryRun && rebuildSnapshot) {
    await rebuildDashboardSnapshot({ force: true });
  }

  return report;
};

export const formatProviderCleanupReport = (
  report: ProviderCleanupReport,
  dryRun: boolean
): string => {
  const lines: string[] = [
    dryRun ? "Provider cleanup audit (dry run)" : "Provider cleanup results",
    "",
    `Schedule engagements audited: ${report.engagementsAudited}`,
    `Missing primary provider: ${report.engagementsMissingPrimary}`,
    `${
      dryRun ? "Would fix primary provider" : "Fixed primary provider"
    }: ${report.engagementsFixedPrimary}`,
    `Packages missing provider: ${report.packagesMissingProvider}`,
    `${
      dryRun ? "Would backfill package provider" : "Backfilled package provider"
    }: ${report.packagesFixedProvider}`,
    `${
      dryRun ? "Would remove junk import packages" : "Removed junk import packages"
    }: ${report.junkPackagesRemoved}`,
    "",
    `Providers total: ${report.providersTotal}`,
    `Providers with revenue: ${report.providersWithRevenue}`,
    `${
      dryRun ? "Would delete zero-revenue providers" : "Deleted zero-revenue providers"
    }: ${report.providersDeleted}`,
  ];

  if (report.unfixedEngagements.length > 0) {
    lines.push("", "Engagements still missing a provider:");
    for (const row of report.unfixedEngagements.slice(0, 25)) {
      lines.push(
        `  - ${row.clientId}/${row.engagementId} (${row.serviceType}, ${row.scheduleYear})`
      );
    }
    if (report.unfixedEngagements.length > 25) {
      lines.push(`  … and ${report.unfixedEngagements.length - 25} more`);
    }
  }

  if (report.deletedProviders.length > 0) {
    lines.push(
      "",
      `${dryRun ? "Would delete" : "Deleted"} (${report.deletedProviders.length}):`
    );
    for (const row of report.deletedProviders) {
      lines.push(`  - ${row.displayName}`);
    }
  }

  const stuck = report.zeroRevenueProviders.filter(
    (row) =>
      !report.deletedProviders.some(
        (deleted) => deleted.providerId === row.providerId
      )
  );

  if (stuck.length > 0) {
    lines.push(
      "",
      `Zero-revenue providers still referenced on engagements (${stuck.length}):`
    );
    for (const row of stuck.slice(0, 25)) {
      lines.push(
        `  - ${row.displayName} (${row.engagementCount} engagement${row.engagementCount === 1 ? "" : "s"})`
      );
    }
    if (stuck.length > 25) {
      lines.push(`  … and ${stuck.length - 25} more`);
    }
  }

  return lines.join("\n");
};
