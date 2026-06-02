/**
 * Live scheduling (Google Calendar API) — implementation pending credentials.
 * Server config: `@/lib/scheduling/config` (server-only).
 * @see docs/platform/google-calendar-concierge-booking.md
 */

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
