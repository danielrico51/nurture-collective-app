"use client";

import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import {
  topProvidersForYear,
  yearBucketFor,
} from "@/lib/dashboard/analyticsView";
import type {
  DashboardEngagementAnalyticsCore,
  DashboardLeadAnalytics,
} from "@/types/dashboard";
import type { LeadStatus } from "@/types/lead";
import Link from "next/link";

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

const SectionSkeleton = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-nurture-sage/15 bg-white/60 p-5">
    <p className="text-sm text-nurture-charcoal/55">{label}</p>
  </div>
);

interface DashboardOverviewTabProps {
  year: number;
  leadAnalytics: DashboardLeadAnalytics | null;
  engagementAnalytics: DashboardEngagementAnalyticsCore | null;
  leadsLoading: boolean;
  engagementsLoading: boolean;
}

const DashboardOverviewTab = ({
  year,
  leadAnalytics,
  engagementAnalytics,
  leadsLoading,
  engagementsLoading,
}: DashboardOverviewTabProps) => {
  const leads = leadAnalytics?.leads;
  const summary = engagementAnalytics?.summary;
  const byYear = engagementAnalytics?.byYear ?? [];
  const byServiceType = engagementAnalytics?.byServiceType;
  const byStatus = engagementAnalytics?.byStatus;
  const ytdYearBucket = yearBucketFor({ byYear }, year);
  const topProviders = engagementAnalytics
    ? topProvidersForYear(engagementAnalytics, year)
    : [];
  const totalServiceCount = byServiceType
    ? byServiceType.birth.count +
      byServiceType.postpartum.count +
      byServiceType.other.count
    : 0;

  return (
    <div className="space-y-8">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={`${year} client revenue`}
            value={formatEngagementMoney(ytdYearBucket?.clientFeeCents ?? 0)}
            detail={`${ytdYearBucket?.engagementCount ?? 0} engagements · margin ${formatEngagementMoney(
              (ytdYearBucket?.clientFeeCents ?? 0) - (ytdYearBucket?.doulaPayoutCents ?? 0)
            )}`}
            highlight
          />
          <KpiCard
            label={`${year} doula payouts`}
            value={formatEngagementMoney(ytdYearBucket?.doulaPayoutCents ?? 0)}
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
      ) : engagementsLoading ? (
        <SectionSkeleton label="Loading engagement KPIs…" />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary ? (
          <KpiCard
            label="Total engagements"
            value={summary.totalEngagements}
            detail={`${summary.historicEngagements} historic import · ${summary.liveEngagements} live`}
          />
        ) : engagementsLoading ? (
          <SectionSkeleton label="Loading engagements…" />
        ) : null}
        {leads ? (
          <>
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
          </>
        ) : leadsLoading ? (
          <>
            <SectionSkeleton label="Loading leads…" />
            <SectionSkeleton label="Loading leads…" />
            <SectionSkeleton label="Loading leads…" />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {leads ? (
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
        ) : leadsLoading ? (
          <SectionSkeleton label="Loading lead pipeline…" />
        ) : null}

        {byServiceType && byStatus ? (
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
        ) : engagementsLoading ? (
          <SectionSkeleton label="Loading service mix…" />
        ) : null}
      </div>

      {engagementAnalytics ? (
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
      ) : engagementsLoading ? (
        <SectionSkeleton label="Loading revenue and provider tables…" />
      ) : null}
    </div>
  );
};

export default DashboardOverviewTab;
