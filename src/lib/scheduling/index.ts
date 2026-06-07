/**
 * Live scheduling (Google Calendar API) for concierge booking.
 * Server config: `@/lib/scheduling/config` (server-only).
 * @see docs/platform/google-calendar-concierge-booking.md
 */

export {
  DEFAULT_GOOGLE_CALENDAR_ID,
  isGoogleSchedulingActive,
  isGoogleSchedulingConfigured,
} from "@/lib/scheduling/config";
export {
  SchedulingNotConfiguredError,
  SchedulingSlotUnavailableError,
} from "@/lib/scheduling/errors";
export type {
  ConsultBooking,
  ConsultBookingSource,
  ConsultBookingStatus,
  SchedulingAvailabilityResponse,
  SchedulingBookRequest,
  SchedulingBookResponse,
  SchedulingSlot,
} from "@/lib/scheduling/types";
