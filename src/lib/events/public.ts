import { getRequestOrigin } from "@/lib/http/requestOrigin";
import type { EventItem } from "@/types/event";

export const fetchPublishedEvents = async (): Promise<EventItem[]> => {
  const origin = getRequestOrigin();
  const response = await fetch(`${origin}/api/events`, { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { items?: EventItem[] };
  return data.items ?? [];
};

export const fetchPublishedEvent = async (
  slug: string
): Promise<EventItem | null> => {
  const origin = getRequestOrigin();
  const response = await fetch(
    `${origin}/api/events/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { item?: EventItem };
  return data.item ?? null;
};
