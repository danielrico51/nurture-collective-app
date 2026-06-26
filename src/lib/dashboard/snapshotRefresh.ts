import { getClientsStorageMode } from "@/lib/clients/config";
import { readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import { buildClientsCrmRootPrefix } from "@/lib/clients/paths";
import {
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import type { DashboardSnapshotStaleMarker } from "@/lib/dashboard/snapshotAge";
import {
  DASHBOARD_SNAPSHOT_AGE_WARN_MS,
  formatSnapshotAge,
  isDashboardSnapshotStale,
  snapshotAgeMs,
} from "@/lib/dashboard/snapshotAge";

export {
  DASHBOARD_SNAPSHOT_AGE_WARN_MS,
  formatSnapshotAge,
  isDashboardSnapshotStale,
  snapshotAgeMs,
};
export type { DashboardSnapshotStaleMarker };

export const DASHBOARD_SNAPSHOT_STALE_FILENAME = "dashboard-stale.json";

export const buildDashboardSnapshotStaleKey = (): string =>
  `${buildClientsCrmRootPrefix()}_indexes/${DASHBOARD_SNAPSHOT_STALE_FILENAME}`;

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

export const readDashboardSnapshotStaleMarker =
  async (): Promise<DashboardSnapshotStaleMarker | null> => {
    const record = await readJson<DashboardSnapshotStaleMarker>(
      buildDashboardSnapshotStaleKey()
    );
    if (!record?.requestedAt) return null;
    return record;
  };

export const markDashboardSnapshotStale = async (
  reason?: string
): Promise<void> => {
  const marker: DashboardSnapshotStaleMarker = {
    requestedAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };
  await writeJson(buildDashboardSnapshotStaleKey(), marker);
};

export const clearDashboardSnapshotStaleMarker = async (): Promise<void> => {
  const marker: DashboardSnapshotStaleMarker = {
    requestedAt: new Date(0).toISOString(),
  };
  await writeJson(buildDashboardSnapshotStaleKey(), marker);
};

/** Call after CRM mutations that affect dashboard aggregates. */
export const notifyDashboardDataChanged = (reason?: string): void => {
  void markDashboardSnapshotStale(reason).catch((error) => {
    console.error("[dashboard] failed to mark snapshot stale:", error);
  });
};
