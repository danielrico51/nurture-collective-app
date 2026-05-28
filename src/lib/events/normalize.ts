import { slugifyTitle } from "@/lib/blog/slug";
import type {
  CreateEventInput,
  EventFormat,
  EventItem,
  EventKind,
  EventListingStatus,
  EventPublishStatus,
} from "@/types/event";

const FORMATS: EventFormat[] = ["In-person", "Virtual", "Hybrid"];
const KINDS: EventKind[] = ["event", "class"];
const LISTING_STATUSES: EventListingStatus[] = [
  "upcoming",
  "ongoing",
  "contact",
  "completed",
];

const isFormat = (v: unknown): v is EventFormat =>
  typeof v === "string" && FORMATS.includes(v as EventFormat);
const isKind = (v: unknown): v is EventKind =>
  typeof v === "string" && KINDS.includes(v as EventKind);
const isListingStatus = (v: unknown): v is EventListingStatus =>
  typeof v === "string" && LISTING_STATUSES.includes(v as EventListingStatus);
const isPublishStatus = (v: unknown): v is EventPublishStatus =>
  v === "draft" || v === "published";

export const normalizeEventItem = (
  raw: Partial<EventItem> & { title: string }
): EventItem => {
  const now = new Date().toISOString();
  const title = raw.title.trim();
  return {
    slug: (raw.slug?.trim() || slugifyTitle(title)).toLowerCase(),
    title,
    excerpt: raw.excerpt?.trim() ?? "",
    body: raw.body?.trim() ?? "",
    kind: isKind(raw.kind) ? raw.kind : "class",
    format: isFormat(raw.format) ? raw.format : "In-person",
    location: raw.location?.trim() || undefined,
    eventDate: raw.eventDate?.trim() || now.slice(0, 10),
    listingStatus: isListingStatus(raw.listingStatus)
      ? raw.listingStatus
      : "upcoming",
    status: isPublishStatus(raw.status) ? raw.status : "draft",
    registrationUrl: raw.registrationUrl?.trim() || undefined,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
};

export const buildCreateEvent = (
  input: CreateEventInput,
  existingSlugs: string[]
): EventItem => {
  let slug = input.slug?.trim().toLowerCase() || slugifyTitle(input.title);
  if (existingSlugs.includes(slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  const now = new Date().toISOString();
  return normalizeEventItem({
    ...input,
    slug,
    createdAt: now,
    updatedAt: now,
  });
};
