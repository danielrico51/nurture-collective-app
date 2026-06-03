import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  getMediaObject,
  isMediaS3Enabled,
  putMediaObject,
} from "@/lib/aws/s3Objects";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "profile-avatars");
const S3_PREFIX = "profile-avatars";

const MAX_BYTES = 2 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_AVATAR_IMAGE_TYPES = Object.keys(EXT_BY_TYPE);

export const validateAvatarImageFile = (file: File): string | null => {
  if (!ALLOWED_AVATAR_IMAGE_TYPES.includes(file.type)) {
    return "Use JPEG, PNG, or WebP for your profile photo.";
  }
  if (file.size > MAX_BYTES) {
    return "Profile photo must be 2 MB or smaller.";
  }
  return null;
};

const safeUserId = (userId: string) => userId.replace(/[^a-zA-Z0-9._:-]/g, "_");

/**
 * Compute the S3 object key + same-origin serving URL for an avatar.
 * Used by the presigned-upload route so the browser can PUT directly to S3.
 */
export const buildAvatarObject = (
  userId: string,
  contentType: string
): { key: string; url: string; filename: string } => {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) {
    throw new Error("Unsupported image type");
  }
  const safe = safeUserId(userId);
  const filename = `${randomUUID()}.${ext}`;
  const key = `${S3_PREFIX}/${safe}/${filename}`;
  const url = `/api/account/avatar/${encodeURIComponent(safe)}/${encodeURIComponent(filename)}`;
  return { key, url, filename };
};

export const storeProfileAvatar = async (
  userId: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; filename: string }> => {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) {
    throw new Error("Unsupported image type");
  }

  const safe = safeUserId(userId);
  const filename = `${randomUUID()}.${ext}`;
  const url = `/api/account/avatar/${encodeURIComponent(safe)}/${encodeURIComponent(filename)}`;

  if (isMediaS3Enabled()) {
    await putMediaObject(`${S3_PREFIX}/${safe}/${filename}`, buffer, contentType);
    return { filename, url };
  }

  const dir = path.join(LOCAL_ROOT, safe);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { filename, url };
};

export const readProfileAvatar = async (
  userId: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> => {
  const safe = safeUserId(userId);
  const safeName = path.basename(filename);

  if (isMediaS3Enabled()) {
    return getMediaObject(`${S3_PREFIX}/${safe}/${safeName}`);
  }

  const filePath = path.join(LOCAL_ROOT, safe, safeName);
  try {
    const buffer = await readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();
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
