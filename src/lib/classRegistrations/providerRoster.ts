import "server-only";

import {
  instructorEmailMatchesEvent,
  verifyProviderRosterToken,
} from "@/lib/classRegistrations/providerAccess";
import { getClassAvailabilityForEvent } from "@/lib/classRegistrations/service";
import { listClassRegistrations } from "@/lib/classRegistrations/storage";
import { getEventBySlug } from "@/lib/events/storage";
import type {
  ClassAvailability,
  ClassRegistration,
  ClassRegistrationPaymentStatus,
  ClassRegistrationStatus,
} from "@/types/classRegistration";
import type { EventItem } from "@/types/event";

export type ProviderRosterEntry = {
  registrantName: string;
  registrantEmail: string;
  registrantPhone?: string;
  status: ClassRegistrationStatus;
  paymentStatus: ClassRegistrationPaymentStatus;
  registeredAt: string;
};

export type ProviderClassRoster = {
  event: Pick<
    EventItem,
    | "slug"
    | "title"
    | "kind"
    | "format"
    | "location"
    | "eventDate"
    | "startTime"
    | "instructorName"
    | "instructorEmail"
  >;
  availability: ClassAvailability;
  registrations: ProviderRosterEntry[];
  expiresAt: string;
};

const toProviderEntry = (registration: ClassRegistration): ProviderRosterEntry => ({
  registrantName: registration.registrantName,
  registrantEmail: registration.registrantEmail,
  registrantPhone: registration.registrantPhone,
  status: registration.status,
  paymentStatus: registration.paymentStatus,
  registeredAt: registration.createdAt,
});

export const getProviderClassRoster = async (
  token: string
): Promise<ProviderClassRoster | null> => {
  const payload = verifyProviderRosterToken(token);
  if (!payload) return null;

  const event = await getEventBySlug(payload.eventSlug, { includeDrafts: true });
  if (!event || !instructorEmailMatchesEvent(event, payload.instructorEmail)) {
    return null;
  }

  const [registrations, availability] = await Promise.all([
    listClassRegistrations(payload.eventSlug),
    getClassAvailabilityForEvent(event),
  ]);

  return {
    event: {
      slug: event.slug,
      title: event.title,
      kind: event.kind,
      format: event.format,
      location: event.location,
      eventDate: event.eventDate,
      startTime: event.startTime,
      instructorName: event.instructorName,
      instructorEmail: event.instructorEmail,
    },
    availability,
    registrations: registrations.map(toProviderEntry),
    expiresAt: payload.expiresAt,
  };
};
