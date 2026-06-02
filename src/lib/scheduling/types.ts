/** Shared scheduling types — see docs/platform/google-calendar-concierge-booking.md */

export type ConsultBookingSource = "concierge" | "embed" | "webhook";

export type ConsultBookingStatus = "confirmed" | "cancelled";

export interface SchedulingSlot {
  /** ISO 8601 with offset */
  start: string;
  end: string;
  /** Human label in coordinator timezone, e.g. "Tue, Jun 3 · 2:00 PM ET" */
  label: string;
}

export interface SchedulingAvailabilityResponse {
  timezone: string;
  slots: SchedulingSlot[];
}

export interface SchedulingBookRequest {
  slotStart: string;
  conversationSessionId?: string;
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface ConsultBooking {
  id: string;
  userId: string;
  conversationSessionId?: string;
  googleEventId: string;
  htmlLink?: string;
  meetLink?: string;
  start: string;
  end: string;
  timezone: string;
  attendeeName: string;
  attendeeEmail: string;
  status: ConsultBookingStatus;
  createdAt: string;
  source: ConsultBookingSource;
}

export interface SchedulingBookResponse {
  booking: ConsultBooking;
}
