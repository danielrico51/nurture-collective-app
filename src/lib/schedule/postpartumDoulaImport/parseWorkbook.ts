import * as XLSX from "xlsx";
import {
  parseScheduleDate,
  yearFromDate,
} from "@/lib/schedule/birthDoulaImport/parseDates";
import {
  POSTPARTUM_SCHEDULE_IMPORT_FILE,
  POSTPARTUM_SCHEDULE_SHEET,
} from "@/lib/schedule/postpartumDoulaImport/constants";

export interface PostpartumScheduleEngagementRow {
  rowNumber: number;
  clientName: string;
  doulaLabel: string;
  startDate: string;
  scheduleYear: number;
  clientFeeDollars: number;
  totalHours: number;
  totalDepositsDollars: number;
  totalDoulaFeeDollars: number;
}

export interface PostpartumScheduleYearTotals {
  scheduleYear: number;
  engagementCount: number;
  clientFeeDollars: number;
  doulaFeeDollars: number;
  depositDollars: number;
}

export interface ParsedPostpartumScheduleWorkbook {
  fileName: string;
  sheetName: string;
  engagements: PostpartumScheduleEngagementRow[];
  yearTotals: PostpartumScheduleYearTotals[];
}

const dollarsToCents = (value: number): number => Math.round(value * 100);

export const moneyDollarsToCents = dollarsToCents;

const isHeaderRow = (row: unknown[]): boolean => {
  const lower = row.map((cell) => String(cell ?? "").trim().toLowerCase());
  return lower.includes("client") && lower.some((cell) => /pp doula/.test(cell));
};

const resolveColumnMap = (headers: string[]) => {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  const indexOf = (label: string) => normalized.indexOf(label);
  const indexOfPattern = (pattern: RegExp) =>
    normalized.findIndex((header) => pattern.test(header));

  return {
    client: indexOf("client"),
    doula: indexOfPattern(/pp doula/),
    startDate: indexOfPattern(/start date/),
    clientFee: indexOfPattern(/client fee/),
    totalHours: indexOfPattern(/total hours/),
    totalDeposits: indexOfPattern(/total deposits/),
    totalDoulaFee: indexOfPattern(/total doula fee/),
  };
};

const cell = (row: unknown[], index: number): unknown =>
  index >= 0 ? row[index] : "";

const parseEngagementRow = (
  row: unknown[],
  columns: ReturnType<typeof resolveColumnMap>,
  rowNumber: number
): PostpartumScheduleEngagementRow | null => {
  const clientName = String(cell(row, columns.client)).trim();
  if (!clientName || /^total/i.test(clientName) || /^client$/i.test(clientName)) {
    return null;
  }

  const doulaLabel = String(cell(row, columns.doula)).trim();
  const clientFeeDollars = Number(cell(row, columns.clientFee)) || 0;
  const totalHours = Number(cell(row, columns.totalHours)) || 0;
  const totalDepositsDollars = Number(cell(row, columns.totalDeposits)) || 0;
  const totalDoulaFeeDollars = Number(cell(row, columns.totalDoulaFee)) || 0;

  if (
    !clientFeeDollars &&
    !totalDoulaFeeDollars &&
    !totalDepositsDollars &&
    !totalHours
  ) {
    return null;
  }

  const startDate =
    parseScheduleDate(cell(row, columns.startDate)) ??
    `${new Date().getFullYear()}-06-01`;
  const scheduleYear = yearFromDate(startDate) ?? new Date().getFullYear();

  return {
    rowNumber,
    clientName,
    doulaLabel,
    startDate,
    scheduleYear,
    clientFeeDollars,
    totalHours,
    totalDepositsDollars,
    totalDoulaFeeDollars,
  };
};

/** Known aggregation typos in Sheet10 — correct before import/verify. */
export const applyPostpartumRowCorrections = (
  row: PostpartumScheduleEngagementRow
): PostpartumScheduleEngagementRow => {
  const name = row.clientName.trim().toLowerCase();
  if (name === "carolyn zegel" && row.totalDoulaFeeDollars > 100_000) {
    return { ...row, totalDoulaFeeDollars: 7096 };
  }
  return row;
};

export const computeYearTotals = (
  engagements: PostpartumScheduleEngagementRow[]
): PostpartumScheduleYearTotals[] => {
  const byYear = new Map<number, PostpartumScheduleYearTotals>();

  for (const engagement of engagements) {
    const current = byYear.get(engagement.scheduleYear) ?? {
      scheduleYear: engagement.scheduleYear,
      engagementCount: 0,
      clientFeeDollars: 0,
      doulaFeeDollars: 0,
      depositDollars: 0,
    };

    current.engagementCount += 1;
    current.clientFeeDollars += engagement.clientFeeDollars;
    current.doulaFeeDollars += engagement.totalDoulaFeeDollars;
    current.depositDollars += engagement.totalDepositsDollars;
    byYear.set(engagement.scheduleYear, current);
  }

  return Array.from(byYear.values()).sort(
    (a, b) => a.scheduleYear - b.scheduleYear
  );
};

export const parsePostpartumScheduleWorkbook = (
  filePath: string,
  fileName = POSTPARTUM_SCHEDULE_IMPORT_FILE,
  sheetName = POSTPARTUM_SCHEDULE_SHEET
): ParsedPostpartumScheduleWorkbook => {
  const workbook = XLSX.readFile(filePath);
  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, {
    header: 1,
    defval: "",
  }) as unknown[][];

  const headerIndex = rows.findIndex((row) => isHeaderRow(row));
  if (headerIndex < 0) {
    throw new Error(`Header row not found in sheet "${sheetName}"`);
  }

  const columns = resolveColumnMap(
    rows[headerIndex]!.map((cellValue) => String(cellValue ?? ""))
  );

  const engagements: PostpartumScheduleEngagementRow[] = [];
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const parsed = parseEngagementRow(rows[index] ?? [], columns, index + 1);
    if (parsed) engagements.push(applyPostpartumRowCorrections(parsed));
  }

  return {
    fileName,
    sheetName,
    engagements,
    yearTotals: computeYearTotals(engagements),
  };
};

export const formatMoney = (dollars: number): string =>
  dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
