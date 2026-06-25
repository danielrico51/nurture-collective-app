"use client";

import DashboardEngagementsTab from "@/components/Admin/DashboardEngagementsTab";
import DashboardOverviewTab from "@/components/Admin/DashboardOverviewTab";
import DashboardTrendsTab from "@/components/Admin/DashboardTrendsTab";
import {
  fetchDashboardEngagementRows,
  fetchDashboardEngagements,
  fetchDashboardLeads,
} from "@/lib/api/dashboardClient";
import type {
  DashboardEngagementAnalytics,
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
  const [leadAnalytics, setLeadAnalytics] = useState<DashboardLeadAnalytics | null>(null);
  const [engagementAnalytics, setEngagementAnalytics] =
    useState<DashboardEngagementAnalytics | null>(null);
  const [engagementRows, setEngagementRows] = useState<DashboardEngagementRow[]>([]);
  const [engagementRowsLoadedAt, setEngagementRowsLoadedAt] = useState<string | null>(
    null
  );
  const [storageLabel, setStorageLabel] = useState("");
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [engagementsLoading, setEngagementsLoading] = useState(true);
  const [engagementRowsLoading, setEngagementRowsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [engagementsError, setEngagementsError] = useState<string | null>(null);
  const [engagementRowsError, setEngagementRowsError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLeadsError(null);
    setLeadsLoading(true);
    try {
      const response = await fetchDashboardLeads();
      setLeadAnalytics(response.analytics);
      setStorageLabel((current) =>
        current.includes(response.storage.leads)
          ? current
          : [current, response.storage.leads].filter(Boolean).join(" · ")
      );
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : "Failed to load lead analytics");
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const loadEngagements = useCallback(
    async (refresh = false) => {
      setEngagementsError(null);
      setEngagementsLoading(true);
      try {
        const response = await fetchDashboardEngagements(year, refresh);
        setEngagementAnalytics(response.analytics);
        setStorageLabel((current) =>
          current.includes(response.storage.clients)
            ? current
            : [response.storage.clients, current].filter(Boolean).join(" · ")
        );
      } catch (err) {
        setEngagementsError(
          err instanceof Error ? err.message : "Failed to load engagement analytics"
        );
      } finally {
        setEngagementsLoading(false);
      }
    },
    [year]
  );

  const loadEngagementRows = useCallback(async (refresh = false) => {
    setEngagementRowsError(null);
    setEngagementRowsLoading(true);
    try {
      const response = await fetchDashboardEngagementRows(refresh);
      setEngagementRows(response.rows);
      setEngagementRowsLoadedAt(response.indexLoadedAt);
      setStorageLabel((current) =>
        current.includes(response.storage.clients)
          ? current
          : [response.storage.clients, current].filter(Boolean).join(" · ")
      );
    } catch (err) {
      setEngagementRowsError(
        err instanceof Error ? err.message : "Failed to load engagement rows"
      );
    } finally {
      setEngagementRowsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    void loadEngagements();
  }, [loadEngagements]);

  useEffect(() => {
    if (tab !== "engagements") return;
    if (engagementRows.length > 0 && !engagementRowsError) return;
    void loadEngagementRows();
  }, [tab, engagementRows.length, engagementRowsError, loadEngagementRows]);

  const refreshAll = () => {
    void loadLeads();
    void loadEngagements(true);
    if (tab === "engagements" || engagementRows.length > 0) {
      void loadEngagementRows(true);
    }
  };

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

  const loading =
    leadsLoading && engagementsLoading && !leadAnalytics && !engagementAnalytics;

  if (loading) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading dashboard analytics…</p>
    );
  }

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
            onClick={refreshAll}
            disabled={leadsLoading || engagementsLoading || engagementRowsLoading}
            className="rounded-lg border border-nurture-sage/25 px-3 py-1.5 text-sm text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
          >
            {leadsLoading || engagementsLoading || engagementRowsLoading
              ? "Refreshing…"
              : "Refresh"}
          </button>
        </div>
      </div>

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

      {engagementsError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Engagement stats: {engagementsError}
          <button
            type="button"
            onClick={() => void loadEngagements(true)}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {leadsError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Lead stats: {leadsError}
          <button
            type="button"
            onClick={() => void loadLeads()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {engagementRowsError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Engagement spreadsheet: {engagementRowsError}
          <button
            type="button"
            onClick={() => void loadEngagementRows(true)}
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
          leadsLoading={leadsLoading}
          engagementsLoading={engagementsLoading}
        />
      ) : tab === "trends" ? (
        <DashboardTrendsTab
          trendYear={trendYear}
          onTrendYearChange={setTrendYear}
          yearOptions={yearOptions}
          leadAnalytics={leadAnalytics}
          engagementAnalytics={engagementAnalytics}
          leadsLoading={leadsLoading}
          engagementsLoading={engagementsLoading}
        />
      ) : (
        <DashboardEngagementsTab
          rows={engagementRows}
          loading={engagementRowsLoading}
          indexLoadedAt={engagementRowsLoadedAt}
        />
      )}

      {engagementAnalytics ? (
        <p className="text-xs text-nurture-charcoal/40">
          Engagement data indexed{" "}
          {new Date(engagementAnalytics.indexLoadedAt).toLocaleString()}
          {leadAnalytics
            ? ` · leads updated ${new Date(leadAnalytics.generatedAt).toLocaleString()}`
            : ""}
          {" · "}Historic rows tagged via import source are counted separately from live CRM
          bookings.
        </p>
      ) : null}
    </div>
  );
};

export default DashboardAnalyticsView;
