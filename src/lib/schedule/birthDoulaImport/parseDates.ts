import * as XLSX from "xlsx";

const EXCEL_EPOCH_MIN = 43000;
const EXCEL_EPOCH_MAX = 47000;

const normalizeYear = (year: number): number => {
  if (year >= 2018 && year <= 2035) return year;
  if (year < 100) return 2000 + year;
  if (year < 2018) return 2000 + (year % 100);
  return year;
};

export const parseExcelSerialDate = (value: number): string | null => {
  if (!Number.isFinite(value)) return null;
  if (value < EXCEL_EPOCH_MIN || value > EXCEL_EPOCH_MAX) return null;
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed?.y) return null;
  return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
};

/** Parse spreadsheet date cells (serials, m/d, m/d/yy, annotations like "9/18 (Z)"). */
export const parseScheduleDate = (
  value: unknown,
  hintYear?: number
): string | null => {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value === "number") {
    return parseExcelSerialDate(value);
  }

  const raw = String(value).trim();
  if (!raw || raw === "-" || /^n\/a$/i.test(raw) || /^plan$/i.test(raw)) {
    return null;
  }

  const withYear = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (withYear) {
    const parsedYear = Number(withYear[3]);
    const year = normalizeYear(
      withYear[3].length === 2 ? 2000 + parsedYear : parsedYear
    );
    return `${year}-${String(withYear[1]).padStart(2, "0")}-${String(withYear[2]).padStart(2, "0")}`;
  }

  const monthDay = raw.match(/^(\d{1,2})\/(\d{1,2})/);
  if (monthDay && hintYear) {
    return `${normalizeYear(hintYear)}-${String(monthDay[1]).padStart(2, "0")}-${String(monthDay[2]).padStart(2, "0")}`;
  }

  return null;
};

export const pickEarliestDate = (...values: Array<string | null | undefined>): string | null => {
  const valid = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: Date.parse(value) }))
    .filter((item) => !Number.isNaN(item.time));
  if (valid.length === 0) return null;
  valid.sort((a, b) => a.time - b.time);
  return valid[0]!.value;
};

export const pickLatestDate = (...values: Array<string | null | undefined>): string | null => {
  const valid = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: Date.parse(value) }))
    .filter((item) => !Number.isNaN(item.time));
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.time - a.time);
  return valid[0]!.value;
};

export const yearFromDate = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : null;
};
