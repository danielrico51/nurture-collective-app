import { describe, expect, it } from "vitest";
import {
  formatSnapshotAge,
  isDashboardSnapshotStale,
  snapshotAgeMs,
} from "@/lib/dashboard/snapshotAge";

describe("snapshotRefresh", () => {
  it("detects when stale marker is newer than snapshot", () => {
    expect(
      isDashboardSnapshotStale(
        { generatedAt: "2026-06-01T12:00:00.000Z", version: 4 } as never,
        { requestedAt: "2026-06-02T12:00:00.000Z" }
      )
    ).toBe(true);
    expect(
      isDashboardSnapshotStale(
        { generatedAt: "2026-06-02T12:00:00.000Z", version: 4 } as never,
        { requestedAt: "2026-06-01T12:00:00.000Z" }
      )
    ).toBe(false);
  });

  it("formats snapshot age for display", () => {
    const now = Date.parse("2026-06-02T15:00:00.000Z");
    expect(formatSnapshotAge("2026-06-02T14:30:00.000Z", now)).toBe("30m ago");
    expect(snapshotAgeMs("2026-06-01T15:00:00.000Z", now)).toBe(86_400_000);
  });
});
