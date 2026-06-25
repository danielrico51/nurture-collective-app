"use client";

import { fetchDashboardAnalytics } from "@/lib/api/dashboardClient";
import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import type { DashboardAnalytics, DashboardMonthlyCount } from "@/types/dashboard";
import type { LeadStatus } from "@/types/lead";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const LEAD_STATUS_LABELS: Partial<Record<LeadStatus, string>> = {
  new: "New",
  intake_in_progress: "Intake in progress",
  intake_completed: "Intake completed",
  consult_scheduled: "Consult scheduled",
  consult_completed: "Consult completed",
  send_to_doula: "Send to doula",
  proposal_sent: "Proposal sent",
  qualified: "Qualified",
  lost: "Lost",
  stale: "Stale",
  converted: "Converted",
  converted_to_member: "Member",
  under_contract: "Under contract",
};

const FUNNEL_STATUSES: LeadStatus[] = [
  "new",
  "intake_in_progress",
  "intake_completed",
  "consult_scheduled",
  "consult_completed",
  "proposal_sent",
  "converted_to_member",
  "under_contract",
];

const formatMonthLabel = (month: string): string => {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const MiniBarChart = ({
  data,
  colorClass = "bg-nurture-sage",
}: {
  data: DashboardMonthlyCount[];
  colorClass?: string;
}) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((row) => (
        <div key={row.month} className="group flex flex-1 flex-col items-center gap-1">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className={`w-full rounded-t transition ${colorClass} opacity-80 group-hover:opacity-100`}
              style={{ height: `${Math.max(4, (row.count / max) * 100)}%` }}
              title={`${formatMonthLabel(row.month)}: ${row.count}`}
            />
          </div>
          <span className="hidden text-[10px] text-nurture-charcoal/40 sm:block">
            {formatMonthLabel(row.month).split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  detail,
  highlight,
}: {
  label: string;
  value: string | number;
  detail?: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-xl border px-4 py-3 ${
      highlight
        ? "border-nurture-sage/30 bg-nurture-sage/5"
        : "border-nurture-sage/15 bg-white/90"
    }`}
  >
    <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-nurture-charcoal">{value}</p>
    {detail ? (
      <p className="mt-1 text-xs text-nurture-charcoal/50">{detail}</p>
    ) : null}
  </div>
);

const DashboardAnalyticsView = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [storageLabel, setStorageLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDashboardAnalytics(year);
      setAnalytics(response.analytics);
      setStorageLabel(`${response.storage.clients} · ${response.storage.leads}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !analytics) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading dashboard analytics…</p>
    );
  }

  if (error && !analytics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
        <button
          type="button"
          onClick={load}
          className="ml-3 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, byYear, byServiceType, byStatus, leads, topProviders } = analytics;
  const ytdYearBucket = byYear.find((b) => b.year === year);
  const totalServiceCount =
    byServiceType.birth.count + byServiceType.postpartum.count + byServiceType.other.count;

  return (
    <div className="space-y-8">
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
        <div className="flex items-center gap-2">
          <label className="text-sm text-nurture-charcoal/60" htmlFor="dashboard-year">
            YTD year
          </label>
          <select
            id="dashboard-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 8 }, (_, i) => currentYear - i + 1).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-nurture-sage/25 px-3 py-1.5 text-sm text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`${year} client revenue`}
          value={formatEngagementMoney(summary.ytdClientFeeCents)}
          detail={`${summary.ytdEngagementCount} engagements · margin ${formatEngagementMoney(summary.ytdMarginCents)}`}
          highlight
        />
        <KpiCard
          label={`${year} doula payouts`}
          value={formatEngagementMoney(summary.ytdDoulaPayoutCents)}
          detail="Package-attributed payouts"
        />
        <KpiCard
          label="Upcoming jobs"
          value={summary.upcomingEngagements}
          detail={`${summary.completedEngagements} completed · ${summary.cancelledEngagements} cancelled`}
        />
        <KpiCard
          label="Active clients"
          value={summary.activeClients}
          detail={`${summary.totalClients} total in CRM`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total engagements"
          value={summary.totalEngagements}
          detail={`${summary.historicEngagements} historic import · ${summary.liveEngagements} live`}
        />
        <KpiCard
          label="Intro calls booked"
          value={leads.consultScheduled}
          detail={`${leads.newThisMonth} new leads this month`}
        />
        <KpiCard
          label="Pipeline conversion"
          value={leads.conversionRate != null ? `${leads.conversionRate}%` : "—"}
          detail={`${leads.converted} converted · ${leads.lost} lost`}
        />
        <KpiCard
          label="Active leads"
          value={leads.active}
          detail={`${leads.total} total including archived`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead funnel */}
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
              Lead pipeline
            </h3>
            <Link
              href="/admin/leads"
              className="text-xs font-medium text-nurture-sage-dark hover:underline"
            >
              Open Lead CRM →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {FUNNEL_STATUSES.map((status) => {
              const count = leads.byStatus[status] ?? 0;
              const maxFunnel = Math.max(
                1,
                ...FUNNEL_STATUSES.map((s) => leads.byStatus[s] ?? 0)
              );
              return (
                <li key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-nurture-charcoal/75">
                      {LEAD_STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="font-medium tabular-nums text-nurture-charcoal">
                      {count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-nurture-cream">
                    <div
                      className="h-full rounded-full bg-nurture-sage/70"
                      style={{ width: `${(count / maxFunnel) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Service mix */}
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Service mix (all time)
          </h3>
          <div className="mt-4 space-y-4">
            {(
              [
                ["birth", "Birth doula", "bg-nurture-sage"],
                ["postpartum", "Postpartum", "bg-nurture-sage-dark"],
                ["other", "Other", "bg-nurture-charcoal/40"],
              ] as const
            ).map(([key, label, barClass]) => {
              const row = byServiceType[key];
              const pct =
                totalServiceCount > 0
                  ? Math.round((row.count / totalServiceCount) * 100)
                  : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-nurture-charcoal/75">{label}</span>
                    <span className="font-medium tabular-nums text-nurture-charcoal">
                      {row.count}{" "}
                      <span className="text-nurture-charcoal/45">
                        ({pct}% · {formatEngagementMoney(row.clientFeeCents)})
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-nurture-cream">
                    <div
                      className={`h-full rounded-full ${barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-nurture-sage/10 pt-4 text-sm">
            {(["booked", "active", "completed", "cancelled"] as const).map((status) => (
              <div key={status}>
                <span className="capitalize text-nurture-charcoal/55">{status}</span>
                <span className="ml-2 font-semibold tabular-nums text-nurture-charcoal">
                  {byStatus[status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            New leads (12 months)
          </h3>
          <div className="mt-4">
            <MiniBarChart data={analytics.monthlyLeads} />
          </div>
        </section>
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Engagement book dates (12 months)
          </h3>
          <div className="mt-4">
            <MiniBarChart
              data={analytics.monthlyEngagementBookings}
              colorClass="bg-nurture-sage-dark"
            />
          </div>
        </section>
      </div>

      {/* Year table + top providers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Revenue by schedule year
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-nurture-sage/15 text-xs uppercase tracking-wide text-nurture-charcoal/45">
                  <th className="pb-2 pr-3 font-medium">Year</th>
                  <th className="pb-2 pr-3 font-medium">Jobs</th>
                  <th className="pb-2 pr-3 font-medium">Birth / PP</th>
                  <th className="pb-2 pr-3 font-medium">Client</th>
                  <th className="pb-2 font-medium">Doula</th>
                </tr>
              </thead>
              <tbody>
                {byYear.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b border-nurture-sage/8 ${
                      row.year === year ? "bg-nurture-sage/5" : ""
                    }`}
                  >
                    <td className="py-2 pr-3 font-medium text-nurture-charcoal">
                      {row.year}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{row.engagementCount}</td>
                    <td className="py-2 pr-3 tabular-nums text-nurture-charcoal/65">
                      {row.birthCount} / {row.postpartumCount}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {formatEngagementMoney(row.clientFeeCents)}
                    </td>
                    <td className="py-2 tabular-nums text-nurture-charcoal/65">
                      {formatEngagementMoney(row.doulaPayoutCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ytdYearBucket ? (
            <p className="mt-3 text-xs text-nurture-charcoal/50">
              Selected year margin:{" "}
              {formatEngagementMoney(
                ytdYearBucket.clientFeeCents - ytdYearBucket.doulaPayoutCents
              )}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
              Top providers ({year} YTD)
            </h3>
            <Link
              href="/admin/providers"
              className="text-xs font-medium text-nurture-sage-dark hover:underline"
            >
              Providers →
            </Link>
          </div>
          {topProviders.length === 0 ? (
            <p className="mt-4 text-sm text-nurture-charcoal/55">
              No provider-attributed engagements for {year} yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-nurture-sage/15 text-xs uppercase tracking-wide text-nurture-charcoal/45">
                    <th className="pb-2 pr-3 font-medium">Provider</th>
                    <th className="pb-2 pr-3 font-medium">Jobs</th>
                    <th className="pb-2 pr-3 font-medium">Client</th>
                    <th className="pb-2 font-medium">Doula</th>
                  </tr>
                </thead>
                <tbody>
                  {topProviders.map((row) => (
                    <tr key={row.providerId} className="border-b border-nurture-sage/8">
                      <td className="py-2 pr-3 font-medium text-nurture-charcoal">
                        {row.displayName}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{row.engagementCount}</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {formatEngagementMoney(row.ytdClientFeeCents)}
                      </td>
                      <td className="py-2 tabular-nums text-nurture-charcoal/65">
                        {formatEngagementMoney(row.ytdDoulaPayoutCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-nurture-charcoal/40">
        Generated {new Date(analytics.generatedAt).toLocaleString()} · Historic rows tagged
        via import source are counted separately from live CRM bookings.
      </p>
    </div>
  );
};

export default DashboardAnalyticsView;
