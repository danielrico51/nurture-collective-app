import * as XLSX from "xlsx";
import {
  parseScheduleDate,
  pickEarliestDate,
  pickLatestDate,
  yearFromDate,
} from "@/lib/schedule/birthDoulaImport/parseDates";

export interface BirthSchedulePackageRow {
  rowNumber: number;
  doulaLabel: string;
  clientFeeDollars: number;
  doulaFeeDollars: number;
  bookDate: string | null;
  dueDate: string | null;
  hospital: string;
  clientDepositDollars: number;
  clientDepositPaid: string | null;
  clientBalanceDollars: number;
  clientBalanceDue: string | null;
  clientBalancePaid: string | null;
  doulaDepositDollars: number;
  doulaDepositPaid: string | null;
  doulaBalanceDollars: number;
  doulaBalancePaid: string | null;
  notes: string;
}

export interface BirthScheduleEngagementBlock {
  sheetName: string;
  rowStart: number;
  clientName: string;
  scheduleYear: number;
  bookDate: string;
  packages: BirthSchedulePackageRow[];
}

export interface BirthScheduleSheetTotals {
  sheetName: string;
  scheduleYear: number | null;
  engagementCount: number;
  packageCount: number;
  clientFeeDollars: number;
  doulaFeeDollars: number;
}

export interface ParsedBirthScheduleWorkbook {
  fileName: string;
  engagements: BirthScheduleEngagementBlock[];
  sheetTotals: BirthScheduleSheetTotals[];
}

const SCHEDULE_SHEETS = ["2020-2022", "2023", "2024", "2025", "2026"] as const;

const dollarsToCents = (value: number): number => Math.round(value * 100);

export const moneyDollarsToCents = dollarsToCents;

const isClientHeaderRow = (row: unknown[]): boolean => {
  const lower = row.map((cell) => String(cell ?? "").trim().toLowerCase());
  return lower.includes("client") && lower.includes("doula");
};

const resolveSheetScheduleYear = (sheetName: string): number | null => {
  if (sheetName === "2020-2022") return null;
  const year = Number(sheetName);
  return Number.isFinite(year) ? year : null;
};

const resolveColumnMap = (headers: string[]) => {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  const indexOf = (label: string) => normalized.indexOf(label);

  const depositIndices = normalized
    .map((header, index) => (header === "deposit" ? index : -1))
    .filter((index) => index >= 0);
  const datePaidIndices = normalized
    .map((header, index) => (header === "date paid" ? index : -1))
    .filter((index) => index >= 0);
  const balanceIndices = normalized
    .map((header, index) => (header === "balance" ? index : -1))
    .filter((index) => index >= 0);

  const doulaFeeIndex = indexOf("doula fee");
  const clientDepositIndex = depositIndices[0] ?? -1;
  const doulaDepositIndex =
    depositIndices.find((index) => index > (doulaFeeIndex >= 0 ? doulaFeeIndex : 0)) ??
    depositIndices[1] ??
    -1;

  const clientBalanceIndex =
    balanceIndices.find((index) => index < (doulaFeeIndex >= 0 ? doulaFeeIndex : 999)) ??
    balanceIndices[0] ??
    -1;
  const doulaBalanceIndex =
    balanceIndices.find((index) => index > (doulaFeeIndex >= 0 ? doulaFeeIndex : -1)) ??
    balanceIndices[1] ??
    -1;

  return {
    client: indexOf("client"),
    doula: indexOf("doula"),
    bookDate: indexOf("book date"),
    dueDate: indexOf("due date"),
    hospital: indexOf("hospital"),
    clientFee: indexOf("client fee"),
    clientDeposit: clientDepositIndex,
    clientDepositPaid: datePaidIndices[0] ?? -1,
    clientBalance: clientBalanceIndex,
    clientBalanceDue: indexOf("balance due"),
    clientBalancePaid: datePaidIndices[1] ?? datePaidIndices[2] ?? -1,
    doulaFee: doulaFeeIndex,
    doulaDeposit: doulaDepositIndex,
    doulaDepositPaid: datePaidIndices[1] ?? -1,
    doulaBalance: doulaBalanceIndex,
    doulaBalancePaid: datePaidIndices[datePaidIndices.length - 1] ?? -1,
  };
};

const cell = (row: unknown[], index: number): unknown =>
  index >= 0 ? row[index] : "";

const parsePackageRow = (
  row: unknown[],
  columns: ReturnType<typeof resolveColumnMap>,
  rowNumber: number,
  hintYear: number | null
): BirthSchedulePackageRow | null => {
  const doulaLabel = String(cell(row, columns.doula)).trim();
  const clientFeeDollars = Number(cell(row, columns.clientFee)) || 0;
  const doulaFeeDollars = Number(cell(row, columns.doulaFee)) || 0;

  if (!doulaLabel && !clientFeeDollars && !doulaFeeDollars) return null;
  if (!doulaLabel && !clientFeeDollars && doulaFeeDollars > 0) {
    // Payout-only continuation row — keep for doula fee tracking.
  }
  if (/^no qb$/i.test(doulaLabel) && !clientFeeDollars && !doulaFeeDollars) {
    return null;
  }

  const dueDate = parseScheduleDate(cell(row, columns.dueDate), hintYear ?? undefined);
  const dueYear = yearFromDate(dueDate);
  const yearHint = dueYear ?? hintYear ?? undefined;

  const bookDate = parseScheduleDate(cell(row, columns.bookDate), yearHint);
  const clientDepositPaid = parseScheduleDate(
    cell(row, columns.clientDepositPaid),
    yearHint
  );
  const clientBalanceDueRaw = String(cell(row, columns.clientBalanceDue)).trim();
  const clientBalanceDue =
    parseScheduleDate(clientBalanceDueRaw, yearHint) ??
    (clientBalanceDueRaw && !/^\d/.test(clientBalanceDueRaw)
      ? clientBalanceDueRaw
      : null);
  const clientBalancePaid = parseScheduleDate(
    cell(row, columns.clientBalancePaid),
    yearHint
  );
  const doulaDepositPaid = parseScheduleDate(
    cell(row, columns.doulaDepositPaid),
    yearHint
  );
  const doulaBalancePaid = parseScheduleDate(
    cell(row, columns.doulaBalancePaid),
    yearHint
  );

  const notes = [
    clientBalanceDue && typeof clientBalanceDue === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(clientBalanceDue)
      ? clientBalanceDue
      : null,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    rowNumber,
    doulaLabel,
    clientFeeDollars,
    doulaFeeDollars,
    bookDate,
    dueDate,
    hospital: String(cell(row, columns.hospital)).trim(),
    clientDepositDollars: Number(cell(row, columns.clientDeposit)) || 0,
    clientDepositPaid,
    clientBalanceDollars: Number(cell(row, columns.clientBalance)) || 0,
    clientBalanceDue:
      typeof clientBalanceDue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(clientBalanceDue)
        ? clientBalanceDue
        : null,
    clientBalancePaid,
    doulaDepositDollars: Number(cell(row, columns.doulaDeposit)) || 0,
    doulaDepositPaid,
    doulaBalanceDollars: Number(cell(row, columns.doulaBalance)) || 0,
    doulaBalancePaid,
    notes,
  };
};

const resolveBookDate = (
  packages: BirthSchedulePackageRow[],
  sheetYear: number | null
): string => {
  const paidDates = packages.flatMap((pkg) => [
    pkg.bookDate,
    pkg.clientDepositPaid,
    pkg.clientBalancePaid,
    pkg.doulaDepositPaid,
    pkg.doulaBalancePaid,
  ]);
  const earliestPaid = pickEarliestDate(...paidDates);
  if (earliestPaid) return earliestPaid;

  const dueDates = packages.map((pkg) => pkg.dueDate);
  const earliestDue = pickEarliestDate(...dueDates);
  if (earliestDue) return earliestDue;

  return `${sheetYear ?? 2020}-06-01`;
};

const resolveScheduleYear = (
  sheetName: string,
  bookDate: string,
  packages: BirthSchedulePackageRow[]
): number => {
  const sheetYear = resolveSheetScheduleYear(sheetName);
  if (sheetYear) return sheetYear;

  const fromBook = yearFromDate(bookDate);
  if (fromBook) return fromBook;

  const dueYears = packages
    .map((pkg) => yearFromDate(pkg.dueDate))
    .filter((year): year is number => year !== null);
  if (dueYears.length > 0) {
    return Math.max(...dueYears);
  }

  return 2021;
};

const parseSheet = (
  sheetName: string,
  rows: unknown[][]
): BirthScheduleEngagementBlock[] => {
  const headerIndex = rows.findIndex((row) => isClientHeaderRow(row));
  if (headerIndex < 0) return [];

  const columns = resolveColumnMap(
    rows[headerIndex]!.map((cellValue) => String(cellValue ?? ""))
  );
  const sheetYear = resolveSheetScheduleYear(sheetName);
  const engagements: BirthScheduleEngagementBlock[] = [];
  let current: BirthScheduleEngagementBlock | null = null;

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const clientName = String(cell(row, columns.client)).trim();

    if (/^total/i.test(clientName)) continue;

    if (
      clientName &&
      !/^client$/i.test(clientName) &&
      !/^birth doula schedule$/i.test(clientName)
    ) {
      const placeholderPackages: BirthSchedulePackageRow[] = [];
      current = {
        sheetName,
        rowStart: index + 1,
        clientName,
        scheduleYear: sheetYear ?? 2020,
        bookDate: "",
        packages: placeholderPackages,
      };
      engagements.push(current);
    }

    if (!current) continue;

    const pkg = parsePackageRow(row, columns, index + 1, sheetYear);
    if (!pkg) continue;
    current.packages.push(pkg);
  }

  for (const engagement of engagements) {
    engagement.bookDate = resolveBookDate(engagement.packages, sheetYear);
    engagement.scheduleYear = resolveScheduleYear(
      sheetName,
      engagement.bookDate,
      engagement.packages
    );
  }

  return engagements.filter(
    (engagement) =>
      engagement.packages.length > 0 &&
      engagement.packages.some(
        (pkg) => pkg.clientFeeDollars > 0 || pkg.doulaFeeDollars > 0
      )
  );
};

export const computeSheetTotals = (
  sheetName: string,
  engagements: BirthScheduleEngagementBlock[]
): BirthScheduleSheetTotals => {
  let clientFeeDollars = 0;
  let doulaFeeDollars = 0;
  let packageCount = 0;

  for (const engagement of engagements) {
    for (const pkg of engagement.packages) {
      clientFeeDollars += pkg.clientFeeDollars;
      doulaFeeDollars += pkg.doulaFeeDollars;
      packageCount += 1;
    }
  }

  return {
    sheetName,
    scheduleYear: resolveSheetScheduleYear(sheetName),
    engagementCount: engagements.length,
    packageCount,
    clientFeeDollars,
    doulaFeeDollars,
  };
};

/** Group 2020-2022 engagements by scheduleYear for per-year verification. */
export const computeYearTotals = (
  engagements: BirthScheduleEngagementBlock[]
): Map<number, BirthScheduleSheetTotals> => {
  const byYear = new Map<number, BirthScheduleSheetTotals>();

  for (const engagement of engagements) {
    const year = engagement.scheduleYear;
    const current = byYear.get(year) ?? {
      sheetName: String(year),
      scheduleYear: year,
      engagementCount: 0,
      packageCount: 0,
      clientFeeDollars: 0,
      doulaFeeDollars: 0,
    };

    current.engagementCount += 1;
    for (const pkg of engagement.packages) {
      current.packageCount += 1;
      current.clientFeeDollars += pkg.clientFeeDollars;
      current.doulaFeeDollars += pkg.doulaFeeDollars;
    }
    byYear.set(year, current);
  }

  return byYear;
};

export const parseBirthScheduleWorkbook = (
  filePath: string,
  fileName = "Birth Doula Schedule.xlsx"
): ParsedBirthScheduleWorkbook => {
  const workbook = XLSX.readFile(filePath);
  const engagements: BirthScheduleEngagementBlock[] = [];

  for (const sheetName of SCHEDULE_SHEETS) {
    if (!workbook.SheetNames.includes(sheetName)) continue;
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, {
      header: 1,
      defval: "",
    }) as unknown[][];
    engagements.push(...parseSheet(sheetName, rows));
  }

  const bySheet = new Map<string, BirthScheduleEngagementBlock[]>();
  for (const engagement of engagements) {
    const list = bySheet.get(engagement.sheetName) ?? [];
    list.push(engagement);
    bySheet.set(engagement.sheetName, list);
  }

  const sheetTotals = SCHEDULE_SHEETS.filter((name) => bySheet.has(name)).map(
    (sheetName) => computeSheetTotals(sheetName, bySheet.get(sheetName)!)
  );

  return { fileName, engagements, sheetTotals };
};

export const formatMoney = (dollars: number): string =>
  dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export { pickLatestDate };
