import type { StoredBirthScheduleTotals } from "@/lib/schedule/birthDoulaImport/importRunner";
import {
  formatMoney,
  type PostpartumScheduleEngagementRow,
  type PostpartumScheduleYearTotals,
} from "@/lib/schedule/postpartumDoulaImport/parseWorkbook";

export interface TotalsVerificationRow {
  label: string;
  expectedEngagements: number;
  actualEngagements: number;
  expectedClientFeeDollars: number;
  actualClientFeeDollars: number;
  expectedDoulaFeeDollars: number;
  actualDoulaFeeDollars: number;
  ok: boolean;
}

const centsToDollars = (cents: number): number => cents / 100;

const rowOk = (expected: number, actual: number, tolerance = 0.01): boolean =>
  Math.abs(expected - actual) <= tolerance;

export const buildExpectedTotalsRows = (
  yearTotals: PostpartumScheduleYearTotals[]
): TotalsVerificationRow[] =>
  yearTotals.map((totals) => ({
    label: String(totals.scheduleYear),
    expectedEngagements: totals.engagementCount,
    actualEngagements: 0,
    expectedClientFeeDollars: totals.clientFeeDollars,
    actualClientFeeDollars: 0,
    expectedDoulaFeeDollars: totals.doulaFeeDollars,
    actualDoulaFeeDollars: 0,
    ok: false,
  }));

export const verifyStoredTotals = (
  expectedRows: TotalsVerificationRow[],
  stored: StoredBirthScheduleTotals[]
): TotalsVerificationRow[] => {
  const storedByYear = new Map(stored.map((item) => [item.year, item]));

  return expectedRows.map((row) => {
    const year = Number(row.label);
    const actual = storedByYear.get(year);
    if (!actual) {
      return {
        ...row,
        actualEngagements: 0,
        actualClientFeeDollars: 0,
        actualDoulaFeeDollars: 0,
        ok: row.expectedEngagements === 0,
      };
    }

    const actualClientFeeDollars = centsToDollars(actual.clientFeeCents);
    const actualDoulaFeeDollars = centsToDollars(actual.doulaFeeCents);
    const ok =
      row.expectedEngagements === actual.engagementCount &&
      rowOk(row.expectedClientFeeDollars, actualClientFeeDollars) &&
      rowOk(row.expectedDoulaFeeDollars, actualDoulaFeeDollars);

    return {
      ...row,
      actualEngagements: actual.engagementCount,
      actualClientFeeDollars,
      actualDoulaFeeDollars,
      ok,
    };
  });
};

export const formatVerificationReport = (
  rows: TotalsVerificationRow[]
): string[] =>
  rows.map((row) => {
    const status = row.ok ? "OK" : "MISMATCH";
    return [
      `[${status}] ${row.label}`,
      `  engagements: expected ${row.expectedEngagements}, actual ${row.actualEngagements}`,
      `  client fees: expected ${formatMoney(row.expectedClientFeeDollars)}, actual ${formatMoney(row.actualClientFeeDollars)}`,
      `  doula fees: expected ${formatMoney(row.expectedDoulaFeeDollars)}, actual ${formatMoney(row.actualDoulaFeeDollars)}`,
    ].join("\n");
  });

export const summarizeWorkbookTotals = (
  yearTotals: PostpartumScheduleYearTotals[]
): string[] => {
  const lines: string[] = ["Expected totals from workbook:"];
  for (const totals of yearTotals) {
    lines.push(
      `  ${totals.scheduleYear}: ${totals.engagementCount} engagements, client ${formatMoney(totals.clientFeeDollars)}, doula ${formatMoney(totals.doulaFeeDollars)}, deposits ${formatMoney(totals.depositDollars)}`
    );
  }
  return lines;
};

export type { PostpartumScheduleEngagementRow };
