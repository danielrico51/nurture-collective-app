import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  getMediaObject,
  isMediaS3Enabled,
  putMediaObject,
} from "@/lib/aws/s3Objects";
import { getCommunityEnvScope } from "@/lib/community/config";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "community-post-images");
const S3_PREFIX = "community-post-images";

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ALLOWED_POST_IMAGE_TYPES = Object.keys(EXT_BY_TYPE);

const contentTypeForExt = (ext: string | undefined): string =>
  ext === "png"
    ? "image/png"
    : ext === "webp"
      ? "image/webp"
      : ext === "gif"
        ? "image/gif"
        : "image/jpeg";

export const validatePostImageFile = (file: File): string | null => {
  if (!ALLOWED_POST_IMAGE_TYPES.includes(file.type)) {
    return "Use JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_BYTES) {
    return "Each photo must be 5 MB or smaller.";
  }
  return null;
};

const safeCommunityId = (communityId: string) =>
  communityId.replace(/[^a-zA-Z0-9-]/g, "");

/**
 * S3 key + same-origin URL for a post image (presigned browser upload).
 */
export const buildPostImageObject = (
  communityId: string,
  contentType: string
): { key: string; url: string; filename: string } => {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) {
    throw new Error("Unsupported image type");
  }
  const safeCommunity = safeCommunityId(communityId);
  const scope = getCommunityEnvScope();
  const filename = `${randomUUID()}.${ext}`;
  const key = `${S3_PREFIX}/${scope}/${safeCommunity}/${filename}`;
  const url = `/api/community/media/${encodeURIComponent(safeCommunity)}/${encodeURIComponent(filename)}`;
  return { key, url, filename };
};

export const storeCommunityPostImage = async (
  communityId: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; filename: string }> => {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) {
    throw new Error("Unsupported image type");
  }

  const safeCommunity = communityId.replace(/[^a-zA-Z0-9-]/g, "");
  const filename = `${randomUUID()}.${ext}`;
  const url = `/api/community/media/${encodeURIComponent(safeCommunity)}/${encodeURIComponent(filename)}`;

  if (isMediaS3Enabled()) {
    const scope = getCommunityEnvScope();
    await putMediaObject(
      `${S3_PREFIX}/${scope}/${safeCommunity}/${filename}`,
      buffer,
      contentType
    );
    return { filename, url };
  }

  const dir = path.join(LOCAL_ROOT, safeCommunity);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { filename, url };
};

export const readCommunityPostImage = async (
  communityId: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> => {
  const safeCommunity = communityId.replace(/[^a-zA-Z0-9-]/g, "");
  const safeName = path.basename(filename);

  if (isMediaS3Enabled()) {
    const scope = getCommunityEnvScope();
    const scopedKey = `${S3_PREFIX}/${scope}/${safeCommunity}/${safeName}`;
    const found = await getMediaObject(scopedKey);
    if (found) return found;
    // Legacy keys before env-scoped prefixes
    return getMediaObject(`${S3_PREFIX}/${safeCommunity}/${safeName}`);
  }

  const filePath = path.join(LOCAL_ROOT, safeCommunity, safeName);
  try {
    const buffer = await readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();
    return { buffer, contentType: contentTypeForExt(ext) };
  } catch {
    return null;
  }
};
