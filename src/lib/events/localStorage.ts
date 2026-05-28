import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { normalizeEventItem } from "@/lib/events/normalize";
import type { EventsDocument } from "@/types/event";

const LOCAL_DIR = path.join(process.cwd(), ".data", "events");
const LOCAL_FILE = path.join(LOCAL_DIR, "items.json");

export const emptyEventsDocument = (): EventsDocument => ({
  version: 1,
  items: [],
  updatedAt: new Date().toISOString(),
});

export const readLocalEventsDocument = async (): Promise<EventsDocument> => {
  try {
    const body = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(body) as EventsDocument;
    if (!Array.isArray(parsed.items)) return emptyEventsDocument();
    return {
      ...parsed,
      items: parsed.items.map((item) => normalizeEventItem(item)),
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyEventsDocument();
    throw error;
  }
};

export const writeLocalEventsDocument = async (
  document: EventsDocument
): Promise<void> => {
  await mkdir(LOCAL_DIR, { recursive: true });
  const payload: EventsDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
};
