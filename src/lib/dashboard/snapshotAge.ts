/** UI warning when snapshot is older than this (does not force rebuild). */
export const DASHBOARD_SNAPSHOT_AGE_WARN_MS = 24 * 60 * 60 * 1000;

export interface DashboardSnapshotStaleMarker {
  requestedAt: string;
  reason?: string;
}

export const isDashboardSnapshotStale = (
  snapshot: { generatedAt: string },
  marker: DashboardSnapshotStaleMarker | null
): boolean => {
  if (!marker?.requestedAt) return false;
  return marker.requestedAt > snapshot.generatedAt;
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
