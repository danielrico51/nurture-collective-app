export type EventFormat = "In-person" | "Virtual" | "Hybrid";
export type EventKind = "event" | "class";
export type EventListingStatus = "upcoming" | "ongoing" | "contact" | "completed";
export type EventPublishStatus = "draft" | "published";
export type EventRegistrationMode = "online" | "contact" | "external";

export interface EventFaqItem {
  question: string;
  answer: string;
}

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
  /** Optional start time (HH:mm, 24h). */
  startTime?: string;
  durationMinutes?: number;
  listingStatus: EventListingStatus;
  status: EventPublishStatus;
  registrationUrl?: string;
  registrationMode?: EventRegistrationMode;
  capacity?: number;
  waitlistEnabled?: boolean;
  priceCents?: number;
  /** CRM provider assigned to teach or lead this session (admin only). */
  providerId?: string | null;
  /** Per-session provider payout in cents (admin only, not shown publicly). */
  providerFeeCents?: number | null;
  /** Per-session platform fee in cents (admin only, not shown publicly). */
  platformFeeCents?: number | null;
  instructorName?: string;
  instructorEmail?: string;
  faq?: EventFaqItem[];
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  googleCalendarSyncedAt?: string;
  googleCalendarSyncError?: string;
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
  startTime?: string;
  durationMinutes?: number;
  listingStatus?: EventListingStatus;
  status?: EventPublishStatus;
  registrationUrl?: string;
  registrationMode?: EventRegistrationMode;
  capacity?: number;
  waitlistEnabled?: boolean;
  priceCents?: number;
  providerId?: string | null;
  providerFeeCents?: number | null;
  platformFeeCents?: number | null;
  instructorName?: string;
  instructorEmail?: string;
  faq?: EventFaqItem[];
  slug?: string;
};

/** Published event shape with admin-only fields removed. */
export type PublicEventItem = Omit<
  EventItem,
  "providerId" | "providerFeeCents" | "platformFeeCents"
>;

export type UpdateEventInput = Partial<
  Omit<EventItem, "slug" | "createdAt" | "updatedAt">
>;

export type EventDigestHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};
