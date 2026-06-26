"use client";

import DashboardEngagementsTab from "@/components/Admin/DashboardEngagementsTab";
import DashboardOverviewTab from "@/components/Admin/DashboardOverviewTab";
import DashboardTrendsTab from "@/components/Admin/DashboardTrendsTab";
import { fetchDashboardSnapshot } from "@/lib/api/dashboardClient";
import {
  DASHBOARD_SNAPSHOT_AGE_WARN_MS,
  formatSnapshotAge,
  snapshotAgeMs,
} from "@/lib/dashboard/snapshotRefresh";
import type {
  DashboardEngagementAnalyticsCore,
  DashboardEngagementRow,
  DashboardLeadAnalytics,
} from "@/types/dashboard";
import { useCallback, useEffect, useMemo, useState } from "react";

type DashboardTab = "overview" | "trends" | "engagements";

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends & growth" },
  { id: "engagements", label: "All engagements" },
];

const DashboardAnalyticsView = () => {
  const currentYear = new Date().getFullYear();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [year, setYear] = useState(currentYear);
  const [trendYear, setTrendYear] = useState(currentYear);
  const [leadAnalytics, setLeadAnalytics] = useState<DashboardLeadAnalytics | null>(
    null
  );
  const [engagementAnalytics, setEngagementAnalytics] =
    useState<DashboardEngagementAnalyticsCore | null>(null);
  const [engagementRows, setEngagementRows] = useState<DashboardEngagementRow[]>([]);
  const [snapshotLoadedAt, setSnapshotLoadedAt] = useState<string | null>(null);
  const [storageLabel, setStorageLabel] = useState("");
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadSnapshot = useCallback(async (refresh = false) => {
    setSnapshotError(null);
    setSnapshotLoading(true);
    try {
      const response = await fetchDashboardSnapshot(refresh);
      setEngagementAnalytics(response.snapshot.engagementAnalytics);
      setEngagementRows(response.snapshot.engagementRows);
      setLeadAnalytics(response.snapshot.leadAnalytics);
      setSnapshotLoadedAt(response.snapshot.generatedAt);
      setStorageLabel(response.storage.clients);
      setNowMs(Date.now());
    } catch (err) {
      setSnapshotError(
        err instanceof Error ? err.message : "Failed to load dashboard snapshot"
      );
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear, year, trendYear]);
    for (const row of engagementAnalytics?.byYear ?? []) {
      years.add(row.year);
    }
    for (const row of engagementAnalytics?.monthlyBookingsHistory ?? []) {
      years.add(Number(row.month.slice(0, 4)));
    }
    for (const row of leadAnalytics?.monthlyLeadsHistory ?? []) {
      years.add(Number(row.month.slice(0, 4)));
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, year, trendYear, engagementAnalytics, leadAnalytics]);

  const snapshotAgeWarning =
    snapshotLoadedAt &&
    snapshotAgeMs(snapshotLoadedAt, nowMs) > DASHBOARD_SNAPSHOT_AGE_WARN_MS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Bookings, engagements, revenue, and lead pipeline at a glance.
          </p>
          {storageLabel ? (
            <p className="mt-1 text-xs text-nurture-charcoal/45">{storageLabel}</p>
          ) : null}
          {snapshotLoadedAt ? (
            <p className="mt-1 text-xs text-nurture-charcoal/45">
              Snapshot updated {formatSnapshotAge(snapshotLoadedAt, nowMs)} (
              {new Date(snapshotLoadedAt).toLocaleString()})
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === "overview" ? (
            <>
              <label className="text-sm text-nurture-charcoal/60" htmlFor="dashboard-year">
                YTD year
              </label>
              <select
                id="dashboard-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => void loadSnapshot(true)}
            disabled={snapshotLoading}
            className="rounded-lg border border-nurture-sage/25 px-3 py-1.5 text-sm text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
          >
            {snapshotLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {snapshotAgeWarning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dashboard data is over 24 hours old. Use Refresh to rebuild from live CRM
          records.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-nurture-sage/15 pb-2">
        {DASHBOARD_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === item.id
                ? "bg-nurture-sage text-white"
                : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {snapshotError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {snapshotError}
          <button
            type="button"
            onClick={() => void loadSnapshot(true)}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {tab === "overview" ? (
        <DashboardOverviewTab
          year={year}
          leadAnalytics={leadAnalytics}
          engagementAnalytics={engagementAnalytics}
          leadsLoading={snapshotLoading && !leadAnalytics}
          engagementsLoading={snapshotLoading && !engagementAnalytics}
        />
      ) : tab === "trends" ? (
        <DashboardTrendsTab
          trendYear={trendYear}
          onTrendYearChange={setTrendYear}
          yearOptions={yearOptions}
          leadAnalytics={leadAnalytics}
          engagementAnalytics={engagementAnalytics}
          leadsLoading={snapshotLoading && !leadAnalytics}
          engagementsLoading={snapshotLoading && !engagementAnalytics}
        />
      ) : (
        <DashboardEngagementsTab
          rows={engagementRows}
          loading={snapshotLoading && engagementRows.length === 0}
          indexLoadedAt={snapshotLoadedAt}
        />
      )}

      {engagementAnalytics ? (
        <p className="text-xs text-nurture-charcoal/40">
          CRM changes mark the snapshot stale; the next dashboard load rebuilds it
          automatically. Historic rows tagged via import source are counted separately
          from live CRM bookings.
        </p>
      ) : null}
    </div>
  );
};

export default DashboardAnalyticsView;
