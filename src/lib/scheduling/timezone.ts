/** Helpers for slot generation in a named IANA timezone. */

export const getTimezoneOffsetMs = (date: Date, timeZone: string): number => {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(date.toLocaleString("en-US", { timeZone }));
  return local.getTime() - utc.getTime();
};

export const zonedDateTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimezoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
};

export const getZonedParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
};

export const weekdayToJsDay = (weekday: string): number => {
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
};

export const formatSlotLabel = (start: Date, timeZone: string): string => {
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(start);
  return formatted.replace(/,([^,]*)$/, " ·$1");
};

export const parseWorkMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + (minutes || 0);
};
