import {
  computeSheetTotals,
  computeYearTotals,
  formatMoney,
  type BirthScheduleEngagementBlock,
  type BirthScheduleSheetTotals,
} from "@/lib/schedule/birthDoulaImport/parseWorkbook";
import type { StoredBirthScheduleTotals } from "@/lib/schedule/birthDoulaImport/importRunner";

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
  engagements: BirthScheduleEngagementBlock[],
  sheetTotals: BirthScheduleSheetTotals[]
): TotalsVerificationRow[] => {
  const rows: TotalsVerificationRow[] = [];

  for (const totals of sheetTotals) {
    if (totals.sheetName === "2020-2022") {
      const byYear = computeYearTotals(
        engagements.filter((item) => item.sheetName === "2020-2022")
      );
      for (const [year, yearTotals] of Array.from(byYear.entries()).sort(
        (a, b) => a[0] - b[0]
      )) {
        rows.push({
          label: String(year),
          expectedEngagements: yearTotals.engagementCount,
          actualEngagements: 0,
          expectedClientFeeDollars: yearTotals.clientFeeDollars,
          actualClientFeeDollars: 0,
          expectedDoulaFeeDollars: yearTotals.doulaFeeDollars,
          actualDoulaFeeDollars: 0,
          ok: false,
        });
      }
      continue;
    }

    rows.push({
      label: totals.sheetName,
      expectedEngagements: totals.engagementCount,
      actualEngagements: 0,
      expectedClientFeeDollars: totals.clientFeeDollars,
      actualClientFeeDollars: 0,
      expectedDoulaFeeDollars: totals.doulaFeeDollars,
      actualDoulaFeeDollars: 0,
      ok: false,
    });
  }

  return rows;
};

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
  engagements: BirthScheduleEngagementBlock[],
  sheetTotals: BirthScheduleSheetTotals[]
): string[] => {
  const lines: string[] = ["Expected totals from workbook:"];

  for (const totals of sheetTotals) {
    if (totals.sheetName === "2020-2022") {
      const byYear = computeYearTotals(
        engagements.filter((item) => item.sheetName === "2020-2022")
      );
      for (const [year, yearTotals] of Array.from(byYear.entries()).sort(
        (a, b) => a[0] - b[0]
      )) {
        lines.push(
          `  ${year}: ${yearTotals.engagementCount} engagements, client ${formatMoney(yearTotals.clientFeeDollars)}, doula ${formatMoney(yearTotals.doulaFeeDollars)}`
        );
      }
      continue;
    }

    lines.push(
      `  ${totals.sheetName}: ${totals.engagementCount} engagements, client ${formatMoney(totals.clientFeeDollars)}, doula ${formatMoney(totals.doulaFeeDollars)}`
    );
  }

  return lines;
};

export { computeSheetTotals, computeYearTotals };
