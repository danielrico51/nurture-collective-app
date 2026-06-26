import { getClientsStorageMode } from "@/lib/clients/config";
import { buildClientsCrmRootPrefix } from "@/lib/clients/paths";
import { readLocalJson, writeLocalJson } from "@/lib/clients/localStorage";
import {
  readClientsJson,
  writeClientsJson,
} from "@/lib/clients/platformS3";
import type { DashboardSnapshot } from "@/types/dashboard";

export const DASHBOARD_SNAPSHOT_STALE_FILENAME = "dashboard-stale.json";

/** UI warning when snapshot is older than this (does not force rebuild). */
export const DASHBOARD_SNAPSHOT_AGE_WARN_MS = 24 * 60 * 60 * 1000;

export interface DashboardSnapshotStaleMarker {
  requestedAt: string;
  reason?: string;
}

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

export const isDashboardSnapshotStale = (
  snapshot: Pick<DashboardSnapshot, "generatedAt">,
  marker: DashboardSnapshotStaleMarker | null
): boolean => {
  if (!marker?.requestedAt) return false;
  return marker.requestedAt > snapshot.generatedAt;
};

/** Call after CRM mutations that affect dashboard aggregates. */
export const notifyDashboardDataChanged = (reason?: string): void => {
  void markDashboardSnapshotStale(reason).catch((error) => {
    console.error("[dashboard] failed to mark snapshot stale:", error);
  });
};

export const snapshotAgeMs = (generatedAt: string, now = Date.now()): number =>
  Math.max(0, now - Date.parse(generatedAt));

export const formatSnapshotAge = (generatedAt: string, now = Date.now()): string => {
  const ageMs = snapshotAgeMs(generatedAt, now);
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
