import "server-only";

import { toPublicEventItem } from "@/lib/events/publicEvent";
import {
  getClassAvailabilityForEvent,
  isOnlineRegistrationEnabled,
} from "@/lib/classRegistrations/service";
import { listPublishedEvents } from "@/lib/events/storage";
import type { ClassAvailability } from "@/types/classRegistration";
import type { EventItem, PublicEventItem } from "@/types/event";

export type BookableClassListing = {
  event: PublicEventItem;
  availability: ClassAvailability;
};

export const isBookableClassListing = (
  event: Pick<
    EventItem,
    "kind" | "status" | "listingStatus" | "registrationMode"
  >
): boolean =>
  event.kind === "class" &&
  event.status === "published" &&
  event.listingStatus !== "completed" &&
  isOnlineRegistrationEnabled(event);

export const listBookableClasses = async (): Promise<BookableClassListing[]> => {
  const published = await listPublishedEvents();
  const candidates = published.filter(isBookableClassListing);

  const listings = await Promise.all(
    candidates.map(async (event) => ({
      event: toPublicEventItem(event),
      availability: await getClassAvailabilityForEvent(event),
    }))
  );

  return listings
    .filter(({ availability }) => availability.registrationOpen)
    .sort(
      (a, b) =>
        new Date(a.event.eventDate).getTime() -
          new Date(b.event.eventDate).getTime() ||
        a.event.title.localeCompare(b.event.title)
    );
};

export const buildBookableClassCta = (
  listing: BookableClassListing
): { label: string; href: string } => {
  const { availability } = listing;
  const basePath = `/events-and-classes/${listing.event.slug}/register`;

  if (
    availability.spotsRemaining === 0 &&
    availability.waitlistEnabled
  ) {
    return {
      label: "Join waitlist",
      href: basePath,
    };
  }

  return {
    label: "Register",
    href: basePath,
  };
};

export const formatBookableSpotsLabel = (
  availability: ClassAvailability
): string => {
  if (availability.capacity === null) return "Open registration";
  if (availability.spotsRemaining === 0 && availability.waitlistEnabled) {
    return "Waitlist open";
  }
  if ((availability.spotsRemaining ?? 0) <= 0) return "Full";
  return `${availability.spotsRemaining} spot${
    availability.spotsRemaining === 1 ? "" : "s"
  } left`;
};
