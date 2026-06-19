import { slugifyTitle } from "@/lib/blog/slug";
import type { EventItem } from "@/types/event";

const defaultFutureDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
};

/**
 * Build a new draft listing from an existing event/class so admins can reopen
 * a past session with fresh dates and without calendar sync baggage.
 */
export const buildDuplicateEventDraft = (
  source: EventItem
): Partial<EventItem> => ({
  title: source.title,
  slug: slugifyTitle(source.title),
  excerpt: source.excerpt,
  body: source.body,
  kind: source.kind,
  format: source.format,
  location: source.location,
  eventDate: defaultFutureDate(),
  startTime: source.startTime,
  durationMinutes: source.durationMinutes,
  listingStatus: "upcoming",
  status: "draft",
  registrationUrl: source.registrationUrl,
  registrationMode: source.registrationMode ?? "online",
  capacity: source.capacity,
  waitlistEnabled: source.waitlistEnabled,
  priceCents: source.priceCents,
  providerId: source.providerId ?? null,
  providerFeeCents: source.providerFeeCents ?? null,
  platformFeeCents: source.platformFeeCents ?? null,
  instructorName: source.instructorName,
  instructorEmail: source.instructorEmail,
  faq: source.faq?.map((entry) => ({ ...entry })) ?? [],
});
