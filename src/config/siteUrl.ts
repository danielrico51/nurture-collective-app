const DEFAULT_SITE_URL = "https://www.nesting-place.com";

/** Canonical public site origin (no trailing slash). */
export const getSiteUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  return configured.replace(/\/$/, "");
};

export const toAbsoluteUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
};
