import "server-only";

import { toPublicEventItem, toPublicEventItems } from "@/lib/events/publicEvent";
import { getEventBySlug, listPublishedEvents } from "@/lib/events/storage";
import type { PublicEventItem } from "@/types/event";

/** Published events for server-rendered marketing pages (no HTTP self-fetch). */
export const fetchPublishedEvents = async (): Promise<PublicEventItem[]> => {
  const items = await listPublishedEvents();
  return toPublicEventItems(items);
};

export const fetchPublishedEvent = async (
  slug: string
): Promise<PublicEventItem | null> => {
  const item = await getEventBySlug(slug);
  return item ? toPublicEventItem(item) : null;
};
