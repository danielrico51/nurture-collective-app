import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  getMediaObject,
  isMediaS3Enabled,
  putMediaObject,
} from "@/lib/aws/s3Objects";

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
    await putMediaObject(
      `${S3_PREFIX}/${safeCommunity}/${filename}`,
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
