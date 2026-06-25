import {
  getZonedParts,
  parseWorkMinutes,
  weekdayToJsDay,
  zonedDateTimeToUtc,
} from "@/lib/scheduling/timezone";

export interface SchedulingWorkHoursConfig {
  timezone: string;
  workDays: number[];
  workHoursStart: string;
  workHoursEnd: string;
  durationMinutes: number;
}

export const normalizeZonedHour = (hour: number): number =>
  hour === 24 ? 0 : hour;

/** Walk calendar days in `timezone` instead of fixed 24h UTC steps (DST-safe). */
export const addCalendarDaysInZone = (
  year: number,
  month: number,
  day: number,
  days: number,
  timeZone: string
): { year: number; month: number; day: number } => {
  const anchor = zonedDateTimeToUtc(year, month, day, 12, 0, timeZone);
  const shifted = new Date(anchor.getTime() + days * 24 * 60 * 60 * 1000);
  const parts = getZonedParts(shifted, timeZone);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
};

export const isSlotWithinConfiguredWorkHours = (
  slotStart: string,
  slotEnd: string,
  config: SchedulingWorkHoursConfig
): boolean => {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const startParts = getZonedParts(start, config.timezone);
  const endParts = getZonedParts(end, config.timezone);
  const jsDay = weekdayToJsDay(startParts.weekday);
  if (!config.workDays.includes(jsDay)) return false;

  if (
    startParts.year !== endParts.year ||
    startParts.month !== endParts.month ||
    startParts.day !== endParts.day
  ) {
    return false;
  }

  const workStartMinutes = parseWorkMinutes(config.workHoursStart);
  const workEndMinutes = parseWorkMinutes(config.workHoursEnd);
  const startMinutes =
    normalizeZonedHour(startParts.hour) * 60 + startParts.minute;
  const endMinutes =
    normalizeZonedHour(endParts.hour) * 60 + endParts.minute;

  return (
    startMinutes >= workStartMinutes &&
    endMinutes <= workEndMinutes &&
    endMinutes > startMinutes
  );
};

export const filterSlotsWithinConfiguredWorkHours = <
  T extends { start: string; end: string },
>(
  slots: T[],
  config: SchedulingWorkHoursConfig
): T[] =>
  slots.filter((slot) =>
    isSlotWithinConfiguredWorkHours(slot.start, slot.end, config)
  );
