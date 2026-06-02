/** Client-safe post image validation (mirrors server limits). */

export const ALLOWED_POST_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_BYTES = 5 * 1024 * 1024;

export const validatePostImageFile = (file: File): string | null => {
  if (!ALLOWED_POST_IMAGE_TYPES.includes(file.type)) {
    return "Use JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_BYTES) {
    return "Each photo must be 5 MB or smaller.";
  }
  return null;
};

/** Turn API-relative media paths into browser-loadable URLs. */
export const resolvePostImageUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
  }
  return url;
};
