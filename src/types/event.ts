export type EventFormat = "In-person" | "Virtual" | "Hybrid";
export type EventKind = "event" | "class";
export type EventListingStatus = "upcoming" | "ongoing" | "contact" | "completed";
export type EventPublishStatus = "draft" | "published";

export interface EventItem {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  kind: EventKind;
  format: EventFormat;
  location?: string;
  /** When the event or class takes place (YYYY-MM-DD). */
  eventDate: string;
  listingStatus: EventListingStatus;
  status: EventPublishStatus;
  registrationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsDocument {
  version: 1;
  items: EventItem[];
  updatedAt: string;
}

export type CreateEventInput = {
  title: string;
  excerpt: string;
  body?: string;
  kind?: EventKind;
  format?: EventFormat;
  location?: string;
  eventDate?: string;
  listingStatus?: EventListingStatus;
  status?: EventPublishStatus;
  registrationUrl?: string;
  slug?: string;
};

export type UpdateEventInput = Partial<
  Omit<EventItem, "slug" | "createdAt" | "updatedAt">
>;
