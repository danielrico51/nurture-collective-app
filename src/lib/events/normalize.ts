import { slugifyTitle } from "@/lib/blog/slug";
import type {
  CreateEventInput,
  EventFaqItem,
  EventFormat,
  EventItem,
  EventKind,
  EventListingStatus,
  EventPublishStatus,
  EventRegistrationMode,
} from "@/types/event";

const FORMATS: EventFormat[] = ["In-person", "Virtual", "Hybrid"];
const KINDS: EventKind[] = ["event", "class"];
const LISTING_STATUSES: EventListingStatus[] = [
  "upcoming",
  "ongoing",
  "contact",
  "completed",
];
const REGISTRATION_MODES: EventRegistrationMode[] = [
  "online",
  "contact",
  "external",
];

const isFormat = (v: unknown): v is EventFormat =>
  typeof v === "string" && FORMATS.includes(v as EventFormat);
const isKind = (v: unknown): v is EventKind =>
  typeof v === "string" && KINDS.includes(v as EventKind);
const isListingStatus = (v: unknown): v is EventListingStatus =>
  typeof v === "string" && LISTING_STATUSES.includes(v as EventListingStatus);
const isPublishStatus = (v: unknown): v is EventPublishStatus =>
  v === "draft" || v === "published";
const isRegistrationMode = (v: unknown): v is EventRegistrationMode =>
  typeof v === "string" && REGISTRATION_MODES.includes(v as EventRegistrationMode);

const parseOptionalPositiveInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
};

const normalizeFaq = (value: unknown): EventFaqItem[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const question = String(record.question ?? record.q ?? "").trim();
      const answer = String(record.answer ?? record.a ?? "").trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((entry): entry is EventFaqItem => entry !== null);
  return items.length ? items : undefined;
};

export const normalizeEventItem = (
  raw: Partial<EventItem> & { title: string }
): EventItem => {
  const now = new Date().toISOString();
  const title = raw.title.trim();
  const kind = isKind(raw.kind) ? raw.kind : "class";

  return {
    slug: (raw.slug?.trim() || slugifyTitle(title)).toLowerCase(),
    title,
    excerpt: raw.excerpt?.trim() ?? "",
    body: raw.body?.trim() ?? "",
    kind,
    format: isFormat(raw.format) ? raw.format : "In-person",
    location: raw.location?.trim() || undefined,
    eventDate: raw.eventDate?.trim() || now.slice(0, 10),
    startTime: raw.startTime?.trim() || undefined,
    durationMinutes: parseOptionalPositiveInt(raw.durationMinutes),
    listingStatus: isListingStatus(raw.listingStatus)
      ? raw.listingStatus
      : "upcoming",
    status: isPublishStatus(raw.status) ? raw.status : "draft",
    registrationUrl: raw.registrationUrl?.trim() || undefined,
    registrationMode: isRegistrationMode(raw.registrationMode)
      ? raw.registrationMode
      : kind === "class"
        ? "online"
        : "contact",
    capacity: parseOptionalPositiveInt(raw.capacity),
    waitlistEnabled: raw.waitlistEnabled === true,
    priceCents: parseOptionalPositiveInt(raw.priceCents),
    instructorName: raw.instructorName?.trim() || undefined,
    instructorEmail: raw.instructorEmail?.trim() || undefined,
    faq: normalizeFaq(raw.faq),
    googleCalendarEventId: raw.googleCalendarEventId?.trim() || undefined,
    googleCalendarHtmlLink: raw.googleCalendarHtmlLink?.trim() || undefined,
    googleCalendarSyncedAt: raw.googleCalendarSyncedAt?.trim() || undefined,
    googleCalendarSyncError: raw.googleCalendarSyncError?.trim() || undefined,
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
