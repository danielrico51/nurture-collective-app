import type { DashboardMonthlyCount, DashboardYoyRow, DashboardYearBucket } from "@/types/dashboard";

export const pctChange = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

export const buildYoyRows = (byYear: DashboardYearBucket[]): DashboardYoyRow[] =>
  byYear.map((row, index) => {
    const previous = index > 0 ? byYear[index - 1] : null;
    const marginCents = row.clientFeeCents - row.doulaPayoutCents;
    const prevMargin = previous
      ? previous.clientFeeCents - previous.doulaPayoutCents
      : null;

    return {
      year: row.year,
      engagementCount: row.engagementCount,
      engagementCountYoyPct: previous
        ? pctChange(row.engagementCount, previous.engagementCount)
        : null,
      clientFeeCents: row.clientFeeCents,
      clientFeeCentsYoyPct: previous
        ? pctChange(row.clientFeeCents, previous.clientFeeCents)
        : null,
      doulaPayoutCents: row.doulaPayoutCents,
      marginCents,
      marginYoyPct:
        prevMargin !== null ? pctChange(marginCents, prevMargin) : null,
      avgRevenuePerJobCents:
        row.engagementCount > 0
          ? Math.round(row.clientFeeCents / row.engagementCount)
          : 0,
    };
  });

export const filterMonthsForYear = (
  rows: DashboardMonthlyCount[],
  year: number
): DashboardMonthlyCount[] => {
  const prefix = `${year}-`;
  const byMonth = new Map(
    rows
      .filter((row) => row.month.startsWith(prefix))
      .map((row) => [row.month, row.count])
  );
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    return { month, count: byMonth.get(month) ?? 0 };
  });
};

export const formatYoyPct = (value: number | null): string => {
  if (value === null) return "—";
  if (value > 0) return `+${value}%`;
  return `${value}%`;
};

export const yoyTone = (value: number | null): string => {
  if (value === null || value === 0) return "text-nurture-charcoal/55";
  return value > 0 ? "text-emerald-700" : "text-red-700";
};
