"use client";

import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import type { DashboardMonthlyCount, DashboardMonthlyRevenue, DashboardYearBucket } from "@/types/dashboard";
import {
  REVENUE_STREAMS,
  streamMonthlyClientFeeCents,
  type RevenueStreamKey,
} from "@/lib/dashboard/revenueStreams";

export const formatMonthShort = (month: string): string => {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

export const formatMonthOnly = (month: string): string => {
  const [, m] = month.split("-");
  const date = new Date(2000, Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
};

export const VerticalBarChart = ({
  data,
  heightClass = "h-48",
  colorClass = "bg-nurture-sage",
  formatValue = (value) => String(value),
}: BarChartProps) => {
  if (data.length === 0) {
    return <p className="text-sm text-nurture-charcoal/55">No data yet.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={`flex ${heightClass} items-stretch gap-1.5`}>
      {data.map((row) => (
        <div
          key={row.label}
          className="group flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1"
        >
          <div className="relative flex min-h-0 w-full flex-1 items-end">
            <div
              className={`w-full rounded-t transition ${colorClass} opacity-85 group-hover:opacity-100`}
              style={{ height: `${Math.max(6, (row.value / max) * 100)}%` }}
              title={row.title ?? `${row.label}: ${formatValue(row.value)}`}
            />
          </div>
          <span className="max-w-full shrink-0 truncate text-[10px] text-nurture-charcoal/45">
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
};

interface BarChartProps {
  data: { label: string; value: number; title?: string }[];
  heightClass?: string;
  colorClass?: string;
  formatValue?: (value: number) => string;
}

interface StackedBarChartProps {
  data: {
    label: string;
    title?: string;
    segments: Record<RevenueStreamKey, number>;
  }[];
  heightClass?: string;
  formatValue?: (value: number) => string;
}

export const StackedVerticalBarChart = ({
  data,
  heightClass = "h-48",
  formatValue = (value) => String(value),
}: StackedBarChartProps) => {
  if (data.length === 0) {
    return <p className="text-sm text-nurture-charcoal/55">No data yet.</p>;
  }

  const max = Math.max(
    1,
    ...data.map((row) =>
      REVENUE_STREAMS.reduce((sum, stream) => sum + (row.segments[stream.key] ?? 0), 0)
    )
  );

  return (
    <div className="space-y-3">
      <div className={`flex ${heightClass} items-stretch gap-1.5`}>
        {data.map((row) => {
          const total = REVENUE_STREAMS.reduce(
            (sum, stream) => sum + (row.segments[stream.key] ?? 0),
            0
          );
          return (
            <div
              key={row.label}
              className="group flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1"
            >
              <div className="relative flex min-h-0 w-full flex-1 items-end">
                <div
                  className="flex w-full flex-col justify-end overflow-hidden rounded-t"
                  style={{ height: `${Math.max(6, (total / max) * 100)}%` }}
                  title={
                    row.title ??
                    REVENUE_STREAMS.map(
                      (stream) =>
                        `${stream.label}: ${formatValue(row.segments[stream.key] ?? 0)}`
                    ).join(" · ")
                  }
                >
                  {REVENUE_STREAMS.map((stream) => {
                    const value = row.segments[stream.key] ?? 0;
                    if (value <= 0) return null;
                    return (
                      <div
                        key={stream.key}
                        className={`${stream.colorClass} opacity-90 group-hover:opacity-100`}
                        style={{ flexGrow: value, flexBasis: 0, minHeight: value > 0 ? 2 : 0 }}
                      />
                    );
                  }).reverse()}
                </div>
              </div>
              <span className="max-w-full shrink-0 truncate text-[10px] text-nurture-charcoal/45">
                {row.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-nurture-charcoal/60">
        {REVENUE_STREAMS.map((stream) => (
          <span key={stream.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${stream.colorClass}`} />
            {stream.label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface GroupedYearBarProps {
  years: number[];
  series: {
    key: string;
    label: string;
    colorClass: string;
    values: Record<number, number>;
    formatValue?: (value: number) => string;
  }[];
}

export const GroupedYearBarChart = ({ years, series }: GroupedYearBarProps) => {
  const max = Math.max(
    1,
    ...series.flatMap((s) => years.map((year) => s.values[year] ?? 0))
  );

  return (
    <div className="space-y-3">
      <div className="flex h-52 items-end gap-3 overflow-x-auto pb-1">
        {years.map((year) => (
          <div key={year} className="flex min-w-[52px] flex-col items-center gap-1">
            <div className="flex h-44 w-full items-end justify-center gap-0.5">
              {series.map((item) => {
                const value = item.values[year] ?? 0;
                const format = item.formatValue ?? ((v: number) => String(v));
                return (
                  <div
                    key={item.key}
                    className={`w-3 rounded-t ${item.colorClass} opacity-90`}
                    style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                    title={`${year} ${item.label}: ${format(value)}`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-nurture-charcoal/70">
              {year}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-nurture-charcoal/60">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${item.colorClass}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface RevenueLineChartProps {
  data: DashboardMonthlyRevenue[];
  maxPoints?: number;
}

export const RevenueTrendChart = ({ data, maxPoints = 24 }: RevenueLineChartProps) => {
  const points = data.slice(-maxPoints);
  if (points.length === 0) {
    return <p className="text-sm text-nurture-charcoal/55">No revenue history yet.</p>;
  }

  const maxRevenue = Math.max(
    1,
    ...points.flatMap((point) =>
      REVENUE_STREAMS.map((stream) => streamMonthlyClientFeeCents(point, stream.key))
    )
  );
  const width = 640;
  const height = 180;
  const padding = 8;

  const streamPaths = REVENUE_STREAMS.map((stream) => {
    const coords = points.map((point, index) => {
      const value = streamMonthlyClientFeeCents(point, stream.key);
      const x =
        padding +
        (index / Math.max(1, points.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        (value / maxRevenue) * (height - padding * 2);
      return { x, y, value, point };
    });
    return { stream, coords };
  });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[320px] w-full"
          role="img"
          aria-label="Monthly client revenue by service type"
        >
          {streamPaths.map(({ stream, coords }) => (
            <polyline
              key={stream.key}
              fill="none"
              className={stream.colorClass.replace("bg-", "stroke-")}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
            />
          ))}
          {streamPaths.flatMap(({ stream, coords }) =>
            coords.map(({ x, y, value, point }) => (
              <circle
                key={`${stream.key}-${point.month}`}
                cx={x}
                cy={y}
                r="3"
                className={stream.colorClass.replace("bg-", "fill-")}
              >
                <title>
                  {stream.label} · {formatMonthShort(point.month)}:{" "}
                  {formatEngagementMoney(value)}
                </title>
              </circle>
            ))
          )}
        </svg>
        <div className="mt-2 flex justify-between text-[10px] text-nurture-charcoal/45">
          <span>{formatMonthShort(points[0].month)}</span>
          <span>{formatMonthShort(points[points.length - 1].month)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-nurture-charcoal/60">
        {REVENUE_STREAMS.map((stream) => (
          <span key={stream.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${stream.colorClass}`} />
            {stream.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const monthlyCountChart = (rows: DashboardMonthlyCount[]) =>
  rows.map((row) => ({
    label: formatMonthOnly(row.month),
    value: row.count,
    title: `${formatMonthShort(row.month)}: ${row.count} bookings`,
  }));

export const yearCountChart = (rows: DashboardYearBucket[]) =>
  rows.map((row) => ({
    label: String(row.year),
    title: `${row.year}: ${row.engagementCount} jobs`,
    segments: {
      birth: row.birthCount,
      postpartum: row.postpartumCount,
      other: row.otherCount,
    } satisfies Record<RevenueStreamKey, number>,
  }));

export const yearRevenueChart = (
  rows: DashboardYearBucket[],
  _formatValue = formatEngagementMoney
) =>
  rows.map((row) => ({
    label: String(row.year),
    title: `${row.year}: ${formatEngagementMoney(row.clientFeeCents)}`,
    segments: {
      birth: row.birthClientFeeCents,
      postpartum: row.postpartumClientFeeCents,
      other: row.otherClientFeeCents,
    } satisfies Record<RevenueStreamKey, number>,
  }));

export const monthlyStreamCountChart = (rows: DashboardMonthlyRevenue[]) =>
  rows.map((row) => ({
    label: formatMonthOnly(row.month),
    title: `${formatMonthShort(row.month)}: ${row.engagementCount} bookings`,
    segments: {
      birth: row.birthCount,
      postpartum: row.postpartumCount,
      other: row.otherCount,
    } satisfies Record<RevenueStreamKey, number>,
  }));

export const monthlyStreamRevenueChart = (rows: DashboardMonthlyRevenue[]) =>
  rows.map((row) => ({
    label: formatMonthOnly(row.month),
    title: `${formatMonthShort(row.month)}: ${formatEngagementMoney(row.clientFeeCents)}`,
    segments: {
      birth: row.birthClientFeeCents,
      postpartum: row.postpartumClientFeeCents,
      other: row.otherClientFeeCents,
    } satisfies Record<RevenueStreamKey, number>,
  }));
