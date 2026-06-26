"use client";

import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import { formatYoyPct, yoyTone } from "@/lib/dashboard/trends";
import type {
  DashboardEngagementAnalyticsCore,
  DashboardLeadAnalytics,
  DashboardYoyRow,
} from "@/types/dashboard";
import Link from "next/link";
import {
  GroupedYearBarChart,
  monthlyCountChart,
  RevenueTrendChart,
  VerticalBarChart,
  yearCountChart,
  yearRevenueChart,
} from "@/components/Admin/DashboardCharts";
import { filterMonthsForYear } from "@/lib/dashboard/trends";

interface DashboardTrendsTabProps {
  trendYear: number;
  onTrendYearChange: (year: number) => void;
  yearOptions: number[];
  leadAnalytics: DashboardLeadAnalytics | null;
  engagementAnalytics: DashboardEngagementAnalyticsCore | null;
  leadsLoading: boolean;
  engagementsLoading: boolean;
}

const YoyGrowthTable = ({ rows }: { rows: DashboardYoyRow[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead>
        <tr className="border-b border-nurture-sage/15 text-xs uppercase tracking-wide text-nurture-charcoal/45">
          <th className="pb-2 pr-3 font-medium">Year</th>
          <th className="pb-2 pr-3 font-medium">Bookings</th>
          <th className="pb-2 pr-3 font-medium">YoY</th>
          <th className="pb-2 pr-3 font-medium">Revenue</th>
          <th className="pb-2 pr-3 font-medium">YoY</th>
          <th className="pb-2 pr-3 font-medium">Margin</th>
          <th className="pb-2 pr-3 font-medium">YoY</th>
          <th className="pb-2 font-medium">Avg / job</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.year} className="border-b border-nurture-sage/8">
            <td className="py-2 pr-3 font-medium text-nurture-charcoal">{row.year}</td>
            <td className="py-2 pr-3 tabular-nums">{row.engagementCount}</td>
            <td className={`py-2 pr-3 tabular-nums ${yoyTone(row.engagementCountYoyPct)}`}>
              {formatYoyPct(row.engagementCountYoyPct)}
            </td>
            <td className="py-2 pr-3 tabular-nums">
              {formatEngagementMoney(row.clientFeeCents)}
            </td>
            <td className={`py-2 pr-3 tabular-nums ${yoyTone(row.clientFeeCentsYoyPct)}`}>
              {formatYoyPct(row.clientFeeCentsYoyPct)}
            </td>
            <td className="py-2 pr-3 tabular-nums">
              {formatEngagementMoney(row.marginCents)}
            </td>
            <td className={`py-2 pr-3 tabular-nums ${yoyTone(row.marginYoyPct)}`}>
              {formatYoyPct(row.marginYoyPct)}
            </td>
            <td className="py-2 tabular-nums text-nurture-charcoal/70">
              {formatEngagementMoney(row.avgRevenuePerJobCents)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DashboardTrendsTab = ({
  trendYear,
  onTrendYearChange,
  yearOptions,
  leadAnalytics,
  engagementAnalytics,
  leadsLoading,
  engagementsLoading,
}: DashboardTrendsTabProps) => {
  const byYear = engagementAnalytics?.byYear ?? [];
  const yoyRows = engagementAnalytics?.yoyByYear ?? [];
  const years = byYear.map((row) => row.year);

  const revenueByYear = Object.fromEntries(
    byYear.map((row) => [row.year, row.clientFeeCents])
  );
  const marginByYear = Object.fromEntries(
    byYear.map((row) => [row.year, row.clientFeeCents - row.doulaPayoutCents])
  );

  const monthlyForYear = engagementAnalytics
    ? filterMonthsForYear(engagementAnalytics.monthlyBookingsHistory, trendYear)
    : [];
  const monthlyLeadForYear = leadAnalytics
    ? filterMonthsForYear(leadAnalytics.monthlyLeadsHistory, trendYear)
    : [];

  const latestYoy = yoyRows[yoyRows.length - 1];

  return (
    <div className="space-y-8">
      {latestYoy ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-nurture-sage/15 bg-white/90 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
              {latestYoy.year} booking growth
            </p>
            <p className={`mt-1 text-2xl font-semibold ${yoyTone(latestYoy.engagementCountYoyPct)}`}>
              {formatYoyPct(latestYoy.engagementCountYoyPct)}
            </p>
            <p className="mt-1 text-xs text-nurture-charcoal/50">
              vs {latestYoy.year - 1} schedule year
            </p>
          </div>
          <div className="rounded-xl border border-nurture-sage/15 bg-white/90 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
              {latestYoy.year} revenue growth
            </p>
            <p className={`mt-1 text-2xl font-semibold ${yoyTone(latestYoy.clientFeeCentsYoyPct)}`}>
              {formatYoyPct(latestYoy.clientFeeCentsYoyPct)}
            </p>
            <p className="mt-1 text-xs text-nurture-charcoal/50">
              {formatEngagementMoney(latestYoy.clientFeeCents)} client fees
            </p>
          </div>
          <div className="rounded-xl border border-nurture-sage/15 bg-nurture-sage/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
              {latestYoy.year} margin growth
            </p>
            <p className={`mt-1 text-2xl font-semibold ${yoyTone(latestYoy.marginYoyPct)}`}>
              {formatYoyPct(latestYoy.marginYoyPct)}
            </p>
            <p className="mt-1 text-xs text-nurture-charcoal/50">
              {formatEngagementMoney(latestYoy.marginCents)} after doula payouts
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Bookings by schedule year
          </h3>
          <p className="mt-1 text-xs text-nurture-charcoal/50">
            Engagements grouped by schedule year (service year on the engagement).
          </p>
          <div className="mt-4">
            {engagementsLoading ? (
              <p className="text-sm text-nurture-charcoal/55">Loading…</p>
            ) : (
              <VerticalBarChart
                data={yearCountChart(byYear)}
                heightClass="h-56"
                colorClass="bg-nurture-sage"
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Revenue & margin by year
          </h3>
          <p className="mt-1 text-xs text-nurture-charcoal/50">
            Client package fees vs retained margin (client revenue minus doula payouts).
          </p>
          <div className="mt-4">
            {engagementsLoading ? (
              <p className="text-sm text-nurture-charcoal/55">Loading…</p>
            ) : (
              <GroupedYearBarChart
                years={years}
                series={[
                  {
                    key: "revenue",
                    label: "Client revenue",
                    colorClass: "bg-nurture-sage",
                    values: revenueByYear,
                    formatValue: formatEngagementMoney,
                  },
                  {
                    key: "margin",
                    label: "Margin",
                    colorClass: "bg-nurture-sage-dark",
                    values: marginByYear,
                    formatValue: formatEngagementMoney,
                  },
                ]}
              />
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Year-over-year growth
        </h3>
        <p className="mt-1 text-xs text-nurture-charcoal/50">
          Normalized change vs the prior schedule year. First year in the dataset has no prior
          comparison.
        </p>
        <div className="mt-4">
          {engagementsLoading ? (
            <p className="text-sm text-nurture-charcoal/55">Loading…</p>
          ) : (
            <YoyGrowthTable rows={yoyRows} />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Monthly client revenue trend
        </h3>
        <p className="mt-1 text-xs text-nurture-charcoal/50">
          Book-date months — last 24 months of package revenue attributed to engagements.
        </p>
        <div className="mt-4">
          {engagementsLoading ? (
            <p className="text-sm text-nurture-charcoal/55">Loading…</p>
          ) : (
            <RevenueTrendChart
              data={engagementAnalytics?.monthlyRevenueHistory ?? []}
              maxPoints={24}
            />
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Monthly breakdown
          </h3>
          <p className="mt-1 text-xs text-nurture-charcoal/50">
            Bookings and new leads by calendar month for the selected year.
          </p>
        </div>
        <select
          value={trendYear}
          onChange={(e) => onTrendYearChange(Number(e.target.value))}
          className="rounded-lg border border-nurture-sage/25 bg-white px-3 py-1.5 text-sm"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <h4 className="text-sm font-semibold text-nurture-charcoal">
            Engagement bookings — {trendYear}
          </h4>
          <div className="mt-4">
            {engagementsLoading ? (
              <p className="text-sm text-nurture-charcoal/55">Loading…</p>
            ) : (
              <VerticalBarChart
                data={monthlyCountChart(monthlyForYear)}
                heightClass="h-44"
                colorClass="bg-nurture-sage-dark"
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-nurture-charcoal">
              New leads — {trendYear}
            </h4>
            <Link
              href="/admin/leads"
              className="text-xs font-medium text-nurture-sage-dark hover:underline"
            >
              Lead CRM →
            </Link>
          </div>
          <div className="mt-4">
            {leadsLoading ? (
              <p className="text-sm text-nurture-charcoal/55">Loading…</p>
            ) : (
              <VerticalBarChart
                data={monthlyCountChart(monthlyLeadForYear)}
                heightClass="h-44"
                colorClass="bg-nurture-charcoal/50"
              />
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-5">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Annual client revenue
        </h3>
        <div className="mt-4">
          {engagementsLoading ? (
            <p className="text-sm text-nurture-charcoal/55">Loading…</p>
          ) : (
            <VerticalBarChart
              data={yearRevenueChart(byYear, formatEngagementMoney)}
              heightClass="h-52"
              colorClass="bg-nurture-sage"
              formatValue={formatEngagementMoney}
            />
          )}
        </div>
      </section>

      <p className="text-xs text-nurture-charcoal/40">
        Schedule-year metrics use the engagement&apos;s service year. Monthly charts use book
        date or lead created date. Historic spreadsheet imports are included in totals.
      </p>
    </div>
  );
};

export default DashboardTrendsTab;
