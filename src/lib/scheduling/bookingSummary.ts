import type { ConsultBooking } from "@/lib/scheduling/types";

export const formatConsultBookingSummary = (booking: ConsultBooking): string => {
  const when = new Date(booking.start).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: booking.timezone,
  });

  const parts = [
    `Introductory call confirmed for ${when} (${booking.timezone})`,
    `Attendee: ${booking.attendeeName} <${booking.attendeeEmail}>`,
  ];

  if (booking.attendeePhone) {
    parts.push(`Phone: ${booking.attendeePhone}`);
  }
  if (booking.notes?.trim()) {
    parts.push(`Notes: ${booking.notes.trim()}`);
  }
  if (booking.meetLink) {
    parts.push(`Google Meet: ${booking.meetLink}`);
  }
  if (booking.htmlLink) {
    parts.push(`Calendar invite: ${booking.htmlLink}`);
  }

  return parts.join(". ");
};
