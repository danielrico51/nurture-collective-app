import type { EventItem, EventKind, EventPublishStatus } from "@/types/event";

export type EventPublishFilter = "all" | "published" | "draft";
export type EventSessionFilter = "all" | "active" | "past";
export type EventKindFilter = "all" | EventKind;
export type EventSortOrder = "date-desc" | "date-asc";

export type AdminEventFilterOptions = {
  query?: string;
  publishFilter?: EventPublishFilter;
  sessionFilter?: EventSessionFilter;
  kindFilter?: EventKindFilter;
  sortOrder?: EventSortOrder;
  /** ISO date (YYYY-MM-DD) for past/active checks; defaults to today (local). */
  referenceDate?: string;
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const isPastEvent = (
  item: EventItem,
  referenceDate = todayIso()
): boolean =>
  item.listingStatus === "completed" || item.eventDate < referenceDate;

export const isActiveEvent = (
  item: EventItem,
  referenceDate = todayIso()
): boolean => !isPastEvent(item, referenceDate);

const matchesPublishFilter = (
  item: EventItem,
  publishFilter: EventPublishFilter
): boolean => {
  if (publishFilter === "all") return true;
  return item.status === (publishFilter as EventPublishStatus);
};

const matchesSessionFilter = (
  item: EventItem,
  sessionFilter: EventSessionFilter,
  referenceDate: string
): boolean => {
  if (sessionFilter === "all") return true;
  if (sessionFilter === "active") return isActiveEvent(item, referenceDate);
  return isPastEvent(item, referenceDate);
};

const matchesKindFilter = (item: EventItem, kindFilter: EventKindFilter): boolean => {
  if (kindFilter === "all") return true;
  return item.kind === kindFilter;
};

const matchesQuery = (item: EventItem, query: string): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    item.title.toLowerCase().includes(normalized) ||
    item.slug.toLowerCase().includes(normalized) ||
    (item.instructorName?.toLowerCase().includes(normalized) ?? false)
  );
};

const compareByEventDate = (left: EventItem, right: EventItem): number =>
  left.eventDate.localeCompare(right.eventDate);

export const filterAdminEvents = (
  items: EventItem[],
  options: AdminEventFilterOptions = {}
): EventItem[] => {
  const {
    query = "",
    publishFilter = "all",
    sessionFilter = "all",
    kindFilter = "all",
    sortOrder = "date-desc",
    referenceDate = todayIso(),
  } = options;

  const filtered = items.filter(
    (item) =>
      matchesQuery(item, query) &&
      matchesPublishFilter(item, publishFilter) &&
      matchesSessionFilter(item, sessionFilter, referenceDate) &&
      matchesKindFilter(item, kindFilter)
  );

  return [...filtered].sort((left, right) => {
    const comparison = compareByEventDate(left, right);
    return sortOrder === "date-asc" ? comparison : -comparison;
  });
};
