import type { EventItem, PublicEventItem } from "@/types/event";

const ADMIN_ONLY_EVENT_FIELDS = [
  "providerId",
  "providerFeeCents",
  "platformFeeCents",
] as const;

/** Strip admin-only provider and fee-split fields before public responses. */
export const toPublicEventItem = (item: EventItem): PublicEventItem => {
  const publicItem = { ...item };
  for (const key of ADMIN_ONLY_EVENT_FIELDS) {
    delete publicItem[key];
  }
  return publicItem;
};

export const toPublicEventItems = (items: EventItem[]): PublicEventItem[] =>
  items.map(toPublicEventItem);
