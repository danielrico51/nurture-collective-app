import { serverSchedulingConfig } from "@/lib/scheduling/config";
import { SchedulingSlotUnavailableError } from "@/lib/scheduling/errors";
import { isSlotStillAvailable } from "@/lib/scheduling/google/availability";
import { getCalendarApi } from "@/lib/scheduling/google/client";
import type { ConsultBooking, SchedulingBookRequest } from "@/lib/scheduling/types";

const readMeetLink = (event: {
  hangoutLink?: string | null;
  conferenceData?: { entryPoints?: Array<{ uri?: string | null }> };
}): string | undefined =>
  event.hangoutLink ??
  event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ??
  undefined;

export const createIntroCallBooking = async (
  request: SchedulingBookRequest & {
    userId: string;
    slotEnd: string;
  }
): Promise<ConsultBooking> => {
  const { calendarId, timezone, eventTitle } = serverSchedulingConfig;

  const available = await isSlotStillAvailable(request.slotStart, request.slotEnd);
  if (!available) {
    throw new SchedulingSlotUnavailableError();
  }

  const api = await getCalendarApi();
  const description = [
    "Booked via The Nesting Place concierge.",
    request.conversationSessionId
      ? `Conversation: ${request.conversationSessionId}`
      : null,
    request.attendee.phone ? `Phone: ${request.attendee.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data } = await api.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: eventTitle,
      description,
      start: {
        dateTime: request.slotStart,
        timeZone: timezone,
      },
      end: {
        dateTime: request.slotEnd,
        timeZone: timezone,
      },
      attendees: request.attendee.email
        ? [{ email: request.attendee.email, displayName: request.attendee.name }]
        : undefined,
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      extendedProperties: {
        private: {
          nurtureUserId: request.userId,
          conversationSessionId: request.conversationSessionId ?? "",
          source: "concierge",
        },
      },
    },
  });

  if (!data.id) {
    throw new Error("Google Calendar did not return an event id");
  }

  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId: request.userId,
    conversationSessionId: request.conversationSessionId,
    googleEventId: data.id,
    htmlLink: data.htmlLink ?? undefined,
    meetLink: readMeetLink(data),
    start: request.slotStart,
    end: request.slotEnd,
    timezone,
    attendeeName: request.attendee.name,
    attendeeEmail: request.attendee.email,
    status: "confirmed",
    createdAt: now,
    source: "concierge",
  };
};

export const resolveSlotEnd = (slotStart: string): string => {
  const start = new Date(slotStart);
  return new Date(
    start.getTime() + serverSchedulingConfig.durationMinutes * 60_000
  ).toISOString();
};
