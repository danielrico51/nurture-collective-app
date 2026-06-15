import "server-only";

import { classCalendarConfig, isClassCalendarSyncEnabled } from "@/config/classCalendar";
import { toAbsoluteUrl } from "@/config/siteUrl";
import { formatEventPrice } from "@/lib/events/format";
import { formatClassCalendarSyncError } from "@/lib/events/calendar/errors";
import {
  buildCalendarEventDescription,
  buildCalendarEventSummary,
  buildEventSessionBounds,
  shouldSyncEventToCalendar,
} from "@/lib/events/calendar/times";
import { serverSchedulingConfig } from "@/lib/scheduling/config";
import { updateEvent } from "@/lib/events/storage";
import { listClassRegistrations } from "@/lib/classRegistrations/storage";
import { getCalendarApi } from "@/lib/scheduling/google/client";
import type { ClassRegistration } from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

const readMeetLink = (event: {
  hangoutLink?: string | null;
  conferenceData?: { entryPoints?: Array<{ uri?: string | null }> };
}): string | undefined =>
  event.hangoutLink ??
  event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ??
  undefined;

const confirmedRegistrations = (
  registrations: ClassRegistration[]
): ClassRegistration[] =>
  registrations.filter((entry) => entry.status === "confirmed");

const attendeeFromRegistration = (registration: ClassRegistration) => ({
  email: registration.registrantEmail,
  displayName: registration.registrantName,
  responseStatus: "accepted" as const,
});

const buildSessionRequestBody = (
  event: EventItem,
  confirmedCount: number
) => {
  const bounds = buildEventSessionBounds(event, {
    timezone: classCalendarConfig.timezone,
    defaultStartTime: classCalendarConfig.defaultStartTime,
    defaultClassDurationMinutes: classCalendarConfig.defaultClassDurationMinutes,
    defaultEventDurationMinutes: classCalendarConfig.defaultEventDurationMinutes,
  });
  const priceLabel = formatEventPrice(event.priceCents);

  return {
    summary: buildCalendarEventSummary(event),
    description: [
      buildCalendarEventDescription(event, confirmedCount),
      priceLabel ? `Fee: ${priceLabel}` : null,
      `Public page: ${toAbsoluteUrl(`/events-and-classes/${event.slug}`)}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    location: event.location,
    start: {
      dateTime: bounds.startDateTime,
      timeZone: bounds.timeZone,
    },
    end: {
      dateTime: bounds.endDateTime,
      timeZone: bounds.timeZone,
    },
    extendedProperties: {
      private: {
        nurtureEventSlug: event.slug,
        nurtureEventKind: event.kind,
        source: "class-events",
      },
    },
  };
};

export const upsertClassCalendarEvent = async (
  event: EventItem,
  registrations: ClassRegistration[] = []
): Promise<Partial<EventItem>> => {
  if (!isClassCalendarSyncEnabled() || !shouldSyncEventToCalendar(event)) {
    return {};
  }

  const api = await getCalendarApi();
  const calendarId = classCalendarConfig.calendarId;
  const confirmed = confirmedRegistrations(registrations);
  const requestBody = {
    ...buildSessionRequestBody(event, confirmed.length),
    attendees: confirmed.map(attendeeFromRegistration),
  };

  const wantsMeet =
    event.format === "Virtual" || event.format === "Hybrid";

  try {
    if (event.googleCalendarEventId) {
      const { data } = await api.events.update({
        calendarId,
        eventId: event.googleCalendarEventId,
        sendUpdates: "all",
        conferenceDataVersion: wantsMeet ? 1 : 0,
        requestBody: {
          ...requestBody,
          ...(wantsMeet && !event.googleCalendarHtmlLink
            ? {
                conferenceData: {
                  createRequest: {
                    requestId: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                  },
                },
              }
            : {}),
        },
      });

      return {
        googleCalendarEventId: data.id ?? event.googleCalendarEventId,
        googleCalendarHtmlLink: data.htmlLink ?? event.googleCalendarHtmlLink,
        googleCalendarSyncedAt: new Date().toISOString(),
        googleCalendarSyncError: "",
      };
    }

    const { data } = await api.events.insert({
      calendarId,
      sendUpdates: "none",
      conferenceDataVersion: wantsMeet ? 1 : 0,
      requestBody: {
        ...requestBody,
        ...(wantsMeet
          ? {
              conferenceData: {
                createRequest: {
                  requestId: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              },
            }
          : {}),
      },
    });

    if (!data.id) {
      throw new Error("Google Calendar did not return an event id");
    }

    return {
      googleCalendarEventId: data.id,
      googleCalendarHtmlLink: data.htmlLink ?? readMeetLink(data),
      googleCalendarSyncedAt: new Date().toISOString(),
      googleCalendarSyncError: "",
    };
  } catch (error) {
    const message = formatClassCalendarSyncError(error, {
      calendarId,
      delegatedUser: serverSchedulingConfig.delegatedUser,
    });
    console.error("[events-calendar] upsert failed:", error);
    return {
      googleCalendarSyncError: message,
    };
  }
};

export const deleteClassCalendarEvent = async (
  event: EventItem
): Promise<Partial<EventItem>> => {
  if (!event.googleCalendarEventId || !isClassCalendarSyncEnabled()) {
    return {};
  }

  try {
    const api = await getCalendarApi();
    await api.events.delete({
      calendarId: classCalendarConfig.calendarId,
      eventId: event.googleCalendarEventId,
      sendUpdates: "all",
    });
    return {
      googleCalendarEventId: undefined,
      googleCalendarHtmlLink: undefined,
      googleCalendarSyncedAt: new Date().toISOString(),
      googleCalendarSyncError: "",
    };
  } catch (error) {
    const message = formatClassCalendarSyncError(error, {
      calendarId: classCalendarConfig.calendarId,
      delegatedUser: serverSchedulingConfig.delegatedUser,
    });
    console.error("[events-calendar] delete failed:", error);
    return { googleCalendarSyncError: message };
  }
};

export const syncEventToGoogleCalendar = async (
  event: EventItem,
  options?: { registrations?: ClassRegistration[] }
): Promise<EventItem> => {
  if (!isClassCalendarSyncEnabled()) return event;

  let registrations = options?.registrations;
  if (registrations === undefined) {
    try {
      registrations = await listClassRegistrations(event.slug);
    } catch (error) {
      console.warn("[events-calendar] could not list registrations; continuing without attendees", {
        eventSlug: event.slug,
        error,
      });
      registrations = [];
    }
  }

  const patch = shouldSyncEventToCalendar(event)
    ? await upsertClassCalendarEvent(event, registrations)
    : await deleteClassCalendarEvent(event);

  if (!Object.keys(patch).length) return event;

  const updated = await updateEvent(event.slug, patch);
  return updated ?? { ...event, ...patch };
};

export const syncRegistrationToGoogleCalendar = async (
  event: EventItem,
  registration: ClassRegistration
): Promise<ClassRegistration> => {
  if (
    !isClassCalendarSyncEnabled() ||
    !shouldSyncEventToCalendar(event) ||
    registration.status === "waitlisted"
  ) {
    return registration;
  }

  const syncedEvent = event.googleCalendarEventId
    ? event
    : await syncEventToGoogleCalendar(event);

  if (!syncedEvent.googleCalendarEventId) {
    return registration;
  }

  const registrations = await listClassRegistrations(event.slug);
  const patch = await upsertClassCalendarEvent(syncedEvent, registrations);
  if (Object.keys(patch).length) {
    await updateEvent(syncedEvent.slug, patch);
  }

  return registration;
};

export const removeRegistrationFromGoogleCalendar = async (
  event: EventItem,
  registration: ClassRegistration
): Promise<void> => {
  if (!isClassCalendarSyncEnabled() || !event.googleCalendarEventId) return;

  const registrations = await listClassRegistrations(event.slug);
  const patch = await upsertClassCalendarEvent(event, registrations);
  if (Object.keys(patch).length) {
    await updateEvent(event.slug, patch);
  }

  console.info("[events-calendar] registration removed from calendar", {
    eventSlug: event.slug,
    registrationId: registration.id,
    email: registration.registrantEmail,
  });
};
