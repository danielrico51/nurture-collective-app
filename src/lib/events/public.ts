import "server-only";

import { getEventBySlug, listPublishedEvents } from "@/lib/events/storage";
import type { EventItem } from "@/types/event";

/** Published events for server-rendered marketing pages (no HTTP self-fetch). */
export const fetchPublishedEvents = async (): Promise<EventItem[]> =>
  listPublishedEvents();

export const fetchPublishedEvent = async (
  slug: string
): Promise<EventItem | null> => getEventBySlug(slug);
