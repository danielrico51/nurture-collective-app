import type { EventFormat, EventKind, EventListingStatus } from "@/types/event";

export const formatEventDate = (date: string): string => {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
};

export const splitEventBody = (body: string): string[] =>
  body
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export const LISTING_STATUS_LABELS: Record<EventListingStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  contact: "Contact to register",
  completed: "Completed",
};

export const listingStatusBadgeClass = (status: EventListingStatus): string => {
  switch (status) {
    case "upcoming":
      return "bg-nurture-sage/15 text-nurture-sage-dark";
    case "ongoing":
      return "bg-violet-100 text-violet-800";
    case "contact":
      return "bg-amber-100 text-amber-900";
    case "completed":
      return "bg-nurture-charcoal/10 text-nurture-charcoal/60";
    default:
      return "bg-nurture-charcoal/10 text-nurture-charcoal/60";
  }
};

export const kindLabel = (kind: EventKind): string =>
  kind === "class" ? "Class" : "Event";

export const formatLabel = (format: EventFormat): string => format;

export const formatEventPrice = (priceCents?: number): string | null => {
  if (typeof priceCents !== "number" || priceCents <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
};

export const formatEventSchedule = (
  eventDate: string,
  startTime?: string
): string => {
  const dateLabel = formatEventDate(eventDate);
  if (!startTime) return dateLabel;
  return `${dateLabel} · ${startTime}`;
};

export const REGISTRATION_MODE_LABELS = {
  online: "Online registration",
  contact: "Contact to register",
  external: "External registration link",
} as const;
