import type { NextRequest } from "next/server";
import { headers } from "next/headers";

export const isLocalhostUrl = (value: string): boolean =>
  /localhost|127\.0\.0\.1/i.test(value);

const resolveOriginFromHeaders = (
  getHeader: (name: string) => string | null
): string => {
  const host = getHeader("x-forwarded-host") ?? getHeader("host");
  const proto = getHeader("x-forwarded-proto") ?? "http";
  if (host) {
    const normalizedHost = host.split(",")[0]?.trim();
    if (normalizedHost) return `${proto}://${normalizedHost}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (appUrl) return appUrl.replace(/\/$/, "");
  return "http://localhost:3000";
};

/** Origin for server-side fetch to this app's API routes during SSR. */
export const getRequestOrigin = (): string =>
  resolveOriginFromHeaders((name) => headers().get(name));

/** Origin for API route handlers (respects reverse-proxy forwarded headers). */
export const getRequestOriginFromNextRequest = (request: NextRequest): string =>
  resolveOriginFromHeaders((name) => request.headers.get(name));
