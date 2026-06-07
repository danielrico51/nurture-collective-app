import "server-only";

/**
 * Server scheduling config — Google Calendar API for concierge booking.
 * @see docs/platform/google-calendar-concierge-booking.md
 */

/** Nesting Place introductory-call calendar (Google Appointment Schedule). */
export const DEFAULT_GOOGLE_CALENDAR_ID =
  "c_2d5a066a46512e1ec02b55c8c92e83e00a9a8e77655de2e712a347fbb969552c@group.calendar.google.com";

const parseWorkDays = (raw: string | undefined): number[] => {
  if (!raw?.trim()) return [1, 2, 3, 4, 5];
  return raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((day) => day >= 0 && day <= 6);
};

const readEnabledFlag = (): boolean => {
  const raw = process.env.GOOGLE_CALENDAR_ENABLED?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return true;
};

export const serverSchedulingConfig = {
  enabled: readEnabledFlag(),
  calendarId:
    process.env.GOOGLE_CALENDAR_ID?.trim() ||
    process.env.GOOGLE_BOOKINGS_CALENDAR_ID?.trim() ||
    DEFAULT_GOOGLE_CALENDAR_ID,
  delegatedUser:
    process.env.GOOGLE_CALENDAR_DELEGATED_USER?.trim() ||
    process.env.GOOGLE_TASKS_DELEGATED_USER?.trim() ||
    "admin@nesting-place.com",
  serviceAccountEmail:
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ??
    process.env.GOOGLE_BOOKINGS_SERVICE_ACCOUNT_EMAIL?.trim() ??
    "",
  serviceAccountPrivateKey:
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "",
  eventTitle:
    process.env.GOOGLE_BOOKING_EVENT_TITLE?.trim() ||
    "Maternal Support Introductory Call",
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
  maxSlotsReturned: Number.parseInt(
    process.env.GOOGLE_BOOKING_MAX_SLOTS ?? "24",
    10
  ),
} as const;

export const isGoogleSchedulingConfigured = (): boolean => {
  const {
    calendarId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    serviceAccountJson,
  } = serverSchedulingConfig;
  if (!calendarId) return false;
  if (serviceAccountJson) return true;
  return Boolean(serviceAccountEmail && serviceAccountPrivateKey);
};

export const isGoogleSchedulingActive = (): boolean =>
  serverSchedulingConfig.enabled && isGoogleSchedulingConfigured();
