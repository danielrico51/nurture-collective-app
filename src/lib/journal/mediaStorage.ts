import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { sanitizePartitionSegment } from "@/lib/intake/partitions";
import { JOURNAL_PARTITION_PREFIX } from "@/lib/journal/keys";
import { ALLOWED_JOURNAL_IMAGE_TYPES } from "@/lib/journal/mediaTypes";
import {
  createJournalPresignedUploadUrl,
  getJournalMediaObject,
  isJournalMediaS3Enabled,
  putJournalMediaObject,
} from "@/lib/journal/s3Media";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "journal", "media");
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export { ALLOWED_JOURNAL_IMAGE_TYPES };

export const validateJournalImageFile = (file: File): string | null => {
  if (!(ALLOWED_JOURNAL_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Use JPEG, PNG, or WebP for timeline photos.";
  }
  if (file.size > MAX_BYTES) {
    return "Photos must be 5 MB or smaller.";
  }
  return null;
};

const safeUserId = (userId: string) => sanitizePartitionSegment(userId);

export const buildJournalMediaObject = (
  userId: string,
  contentType: string
): { key: string; url: string; filename: string } => {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) throw new Error("Unsupported image type");
  const safe = safeUserId(userId);
  const filename = `${randomUUID()}.${ext}`;
  const key = `${JOURNAL_PARTITION_PREFIX}user=${safe}/media/${filename}`;
  const url = `/api/journal/media/${encodeURIComponent(safe)}/${encodeURIComponent(filename)}`;
  return { key, url, filename };
};

export const storeJournalMedia = async (
  userId: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; filename: string }> => {
  const { key, url, filename } = buildJournalMediaObject(userId, contentType);

  if (isJournalMediaS3Enabled()) {
    await putJournalMediaObject(key, buffer, contentType);
    return { url, filename };
  }

  const dir = path.join(LOCAL_ROOT, safeUserId(userId));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url, filename };
};

export const readJournalMedia = async (
  userId: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> => {
  const safe = safeUserId(userId);
  const decoded = decodeURIComponent(filename);

  if (isJournalMediaS3Enabled()) {
    const key = `${JOURNAL_PARTITION_PREFIX}user=${safe}/media/${decoded}`;
    const result = await getJournalMediaObject(key);
    if (!result) return null;
    return { buffer: result.buffer, contentType: result.contentType };
  }

  try {
    const filePath = path.join(LOCAL_ROOT, safe, decoded);
    const buffer = await readFile(filePath);
    const ext = decoded.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    return { buffer, contentType };
  } catch {
    return null;
  }
};
