import "server-only";

import { readProvider } from "@/lib/providers/storage";
import type { EventItem } from "@/types/event";

export class EventProviderLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventProviderLinkError";
  }
}

/** Resolve provider link and sync instructor contact when a CRM provider is assigned. */
export const applyEventProviderLink = async <
  T extends Partial<EventItem> & { title: string },
>(
  input: T
): Promise<T> => {
  const providerId = input.providerId?.trim() || null;
  if (!providerId) {
    return { ...input, providerId: null };
  }

  const provider = await readProvider(providerId);
  if (!provider) {
    throw new EventProviderLinkError("Provider not found");
  }

  return {
    ...input,
    providerId,
    instructorName: input.instructorName?.trim() || provider.displayName,
    instructorEmail: input.instructorEmail?.trim() || provider.email,
  };
};
