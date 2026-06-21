import "server-only";

import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { isValidSlug } from "@/lib/blog/slug";
import { buildCreateEvent, normalizeEventItem } from "@/lib/events/normalize";
import {
  applyEventProviderLink,
  EventProviderLinkError,
} from "@/lib/events/providerLink";
import { SAMPLE_EVENTS } from "@/lib/events/samples";
import {
  emptyEventsDocument,
  readLocalEventsDocument,
  writeLocalEventsDocument,
} from "@/lib/events/localStorage";
import { eventsStorageConfig } from "@/lib/events/config";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import type {
  CreateEventInput,
  EventItem,
  EventsDocument,
  UpdateEventInput,
} from "@/types/event";

export const getEventsStorageMode = (): "local" | "s3" =>
  eventsStorageConfig.useLocalStorage ? "local" : "s3";

const getS3Client = () => {
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  return new S3Client({
    region,
    credentials: getServerCredentials(),
  });
};

const getBucket = () => eventsStorageConfig.bucket;

const getObjectKey = () => eventsStorageConfig.s3Key;

const readS3EventsDocument = async (): Promise<EventsDocument> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket, Key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return emptyEventsDocument();

    const parsed = JSON.parse(body) as EventsDocument;
    if (!Array.isArray(parsed.items)) return emptyEventsDocument();
    return {
      ...parsed,
      items: parsed.items.map((item) => normalizeEventItem(item)),
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return emptyEventsDocument();
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      err.name === "NoSuchKey" ||
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return emptyEventsDocument();
    }
    throw error;
  }
};

const writeS3EventsDocument = async (document: EventsDocument): Promise<void> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: JSON.stringify(
        { ...document, updatedAt: new Date().toISOString() },
        null,
        2
      ),
      ContentType: "application/json",
    })
  );
};

const isCredentialsError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "CredentialsProviderError" ||
    /could not load credentials|Unable to locate credentials/i.test(error.message)
  );
};

const readEventsDocument = async (): Promise<EventsDocument> => {
  if (eventsStorageConfig.useLocalStorage) {
    return readLocalEventsDocument();
  }
  try {
    return await readS3EventsDocument();
  } catch (error) {
    if (isCredentialsError(error)) {
      console.warn("[events] S3 credentials unavailable; using local storage.");
      return readLocalEventsDocument();
    }
    throw error;
  }
};

const writeEventsDocument = async (document: EventsDocument): Promise<void> => {
  if (eventsStorageConfig.useLocalStorage) {
    return writeLocalEventsDocument(document);
  }
  return writeS3EventsDocument(document);
};

const sortEvents = (items: EventItem[]): EventItem[] =>
  [...items].sort(
    (a, b) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime() ||
      a.title.localeCompare(b.title)
  );

export const seedEventsSamplesIfEmpty = async (): Promise<boolean> => {
  const doc = await readEventsDocument();
  if (doc.items.length > 0) return false;
  await writeEventsDocument({
    version: 1,
    items: SAMPLE_EVENTS,
    updatedAt: new Date().toISOString(),
  });
  return true;
};

export const listAllEvents = async (): Promise<EventItem[]> => {
  const doc = await readEventsDocument();
  if (doc.items.length === 0) {
    await seedEventsSamplesIfEmpty();
    const seeded = await readEventsDocument();
    return sortEvents(seeded.items);
  }
  return sortEvents(doc.items);
};

export const listPublishedEvents = async (): Promise<EventItem[]> => {
  const items = await listAllEvents();
  return items.filter((item) => item.status === "published");
};

export const getEventBySlug = async (
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<EventItem | null> => {
  if (!isValidSlug(slug)) return null;
  const item = (await listAllEvents()).find((entry) => entry.slug === slug) ?? null;
  if (!item) return null;
  if (!options?.includeDrafts && item.status !== "published") return null;
  return item;
};

export const createEvent = async (input: CreateEventInput): Promise<EventItem> => {
  const doc = await readEventsDocument();
  const slugs = doc.items.map((item) => item.slug);
  const linked = await applyEventProviderLink(input);
  const item = buildCreateEvent(linked, slugs);
  if (!item.title) throw new Error("Title is required");
  await writeEventsDocument({
    ...doc,
    items: [...doc.items, item],
  });
  return item;
};

export const updateEvent = async (
  slug: string,
  input: UpdateEventInput
): Promise<EventItem | null> => {
  if (!isValidSlug(slug)) return null;
  const doc = await readEventsDocument();
  const index = doc.items.findIndex((item) => item.slug === slug);
  if (index < 0) return null;

  const current = doc.items[index];
  const linked = await applyEventProviderLink({
    ...current,
    ...input,
    title: input.title?.trim() || current.title,
  });
  const next = normalizeEventItem({
    ...linked,
    slug: current.slug,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });

  const items = [...doc.items];
  items[index] = next;
  await writeEventsDocument({ ...doc, items });
  return next;
};

export const deleteEvent = async (slug: string): Promise<boolean> => {
  if (!isValidSlug(slug)) return false;
  const doc = await readEventsDocument();
  const items = doc.items.filter((item) => item.slug !== slug);
  if (items.length === doc.items.length) return false;
  await writeEventsDocument({ ...doc, items });
  return true;
};

export { EventProviderLinkError };
