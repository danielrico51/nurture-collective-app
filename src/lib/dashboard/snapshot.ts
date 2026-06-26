import { getClientsStorageMode } from "@/lib/clients/config";
import { buildClientsCrmRootPrefix } from "@/lib/clients/paths";
import { readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import { invalidateCrmStorageIndexCache, loadCrmStorageIndex } from "@/lib/clients/crmIndexLoader";
import { computeDashboardLeadAnalytics } from "@/lib/dashboard/analytics";
import { computeEngagementAnalyticsCore } from "@/lib/dashboard/engagementAnalyticsCore";
import { buildEngagementRowsFromIndex } from "@/lib/dashboard/engagementRows";
import {
  clearDashboardSnapshotStaleMarker,
  isDashboardSnapshotStale,
  readDashboardSnapshotStaleMarker,
} from "@/lib/dashboard/snapshotRefresh";
import { listProviders } from "@/lib/providers/storage";
import type { DashboardSnapshot } from "@/types/dashboard";

export const DASHBOARD_SNAPSHOT_VERSION = 2 as const;
export const DASHBOARD_SNAPSHOT_FILENAME = "dashboard-v1.json";

export const buildDashboardSnapshotKey = (): string =>
  `${buildClientsCrmRootPrefix()}_indexes/${DASHBOARD_SNAPSHOT_FILENAME}`;

const readJson = async <T>(key: string): Promise<T | null> =>
  getClientsStorageMode() === "local"
    ? readLocalJson<T>(key)
    : readClientsJson<T>(key);

const writeJson = async (key: string, payload: unknown): Promise<void> => {
  if (getClientsStorageMode() === "local") {
    await writeLocalJson(key, payload);
  } else {
    await writeClientsJson(key, payload);
  }
};

export const buildDashboardSnapshot = async (options?: {
  force?: boolean;
}): Promise<DashboardSnapshot> => {
  if (options?.force) {
    invalidateCrmStorageIndexCache();
  }

  const [crmIndex, providers, leadAnalytics] = await Promise.all([
    loadCrmStorageIndex({ force: options?.force }),
    listProviders({ includeArchived: true }),
    computeDashboardLeadAnalytics({ force: options?.force }),
  ]);

  const engagementAnalytics = computeEngagementAnalyticsCore(crmIndex, providers);
  const engagementRows = buildEngagementRowsFromIndex(crmIndex, providers);

  return {
    version: DASHBOARD_SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    indexLoadedAt: crmIndex.loadedAt,
    engagementAnalytics,
    engagementRows,
    leadAnalytics,
  };
};

export const writeDashboardSnapshot = async (
  snapshot: DashboardSnapshot
): Promise<string> => {
  const key = buildDashboardSnapshotKey();
  await writeJson(key, snapshot);
  return key;
};

export const readDashboardSnapshot = async (): Promise<DashboardSnapshot | null> => {
  const key = buildDashboardSnapshotKey();
  const record = await readJson<DashboardSnapshot>(key);
  if (!record || record.version !== DASHBOARD_SNAPSHOT_VERSION) {
    return null;
  }
  return record;
};

export const rebuildDashboardSnapshot = async (options?: {
  force?: boolean;
}): Promise<{ key: string; snapshot: DashboardSnapshot }> => {
  const snapshot = await buildDashboardSnapshot(options);
  const key = await writeDashboardSnapshot(snapshot);
  await clearDashboardSnapshotStaleMarker();
  return { key, snapshot };
};

export const loadDashboardSnapshot = async (options?: {
  force?: boolean;
  /** When true, always rebuild from live CRM data. */
  live?: boolean;
}): Promise<DashboardSnapshot> => {
  const staleMarker = await readDashboardSnapshotStaleMarker();

  if (!options?.force && !options?.live) {
    const cached = await readDashboardSnapshot();
    if (
      cached &&
      cached.version === DASHBOARD_SNAPSHOT_VERSION &&
      !isDashboardSnapshotStale(cached, staleMarker)
    ) {
      return cached;
    }
  }

  const snapshot = await buildDashboardSnapshot({ force: true });
  await writeDashboardSnapshot(snapshot);
  await clearDashboardSnapshotStaleMarker();
  return snapshot;
};
