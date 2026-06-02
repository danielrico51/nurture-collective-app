import "server-only";

/**
 * Server scheduling config — implement google/client.ts when credentials exist.
 * @see docs/platform/google-calendar-concierge-booking.md
 */

const parseWorkDays = (raw: string | undefined): number[] => {
  if (!raw?.trim()) return [1, 2, 3, 4, 5];
  return raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((day) => day >= 0 && day <= 6);
};

export const serverSchedulingConfig = {
  enabled: process.env.GOOGLE_CALENDAR_ENABLED?.trim().toLowerCase() === "true",
  calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() ?? "",
  serviceAccountEmail:
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ??
    process.env.GOOGLE_BOOKINGS_SERVICE_ACCOUNT_EMAIL?.trim() ??
    "",
  serviceAccountPrivateKey:
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "",
  durationMinutes: Number.parseInt(
    process.env.GOOGLE_BOOKING_DURATION_MINUTES ?? "30",
    10
  ),
  bufferMinutes: Number.parseInt(
    process.env.GOOGLE_BOOKING_BUFFER_MINUTES ?? "15",
    10
  ),
  timezone: process.env.GOOGLE_BOOKING_TIMEZONE?.trim() || "America/New_York",
  workHoursStart: process.env.GOOGLE_BOOKING_WORK_HOURS_START?.trim() || "09:00",
  workHoursEnd: process.env.GOOGLE_BOOKING_WORK_HOURS_END?.trim() || "17:00",
  workDays: parseWorkDays(process.env.GOOGLE_BOOKING_WORK_DAYS),
  availabilityHorizonDays: Number.parseInt(
    process.env.GOOGLE_BOOKING_HORIZON_DAYS ?? "14",
    10
  ),
  minLeadTimeHours: Number.parseInt(
    process.env.GOOGLE_BOOKING_MIN_LEAD_HOURS ?? "2",
    10
  ),
} as const;

export const isGoogleSchedulingConfigured = (): boolean => {
  const { calendarId, serviceAccountEmail, serviceAccountPrivateKey, serviceAccountJson } =
    serverSchedulingConfig;
  const hasKey = Boolean(serviceAccountPrivateKey || serviceAccountJson);
  return Boolean(calendarId && serviceAccountEmail && hasKey);
};

export const isGoogleSchedulingActive = (): boolean =>
  serverSchedulingConfig.enabled && isGoogleSchedulingConfigured();
