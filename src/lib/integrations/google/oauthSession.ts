import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { serverGoogleTasksConfig } from "@/config/googleTasks";
import {
  getRequestOriginFromNextRequest,
  isLocalhostUrl,
} from "@/lib/http/requestOrigin";

export const GOOGLE_TASKS_OAUTH_STATE_COOKIE = "google_tasks_oauth_state";
export const GOOGLE_TASKS_OAUTH_ORIGIN_COOKIE = "google_tasks_oauth_origin";

const getStateSecret = (): string =>
  process.env.GOOGLE_TASKS_OAUTH_STATE_SECRET?.trim() ||
  process.env.GOOGLE_TASKS_OAUTH_CLIENT_SECRET?.trim() ||
  "google-tasks-oauth-state";

export const createGoogleTasksOAuthState = (): string =>
  randomBytes(24).toString("hex");

export const applyGoogleTasksOAuthStateCookie = (
  response: NextResponse,
  state: string
): void => {
  response.cookies.set(
    GOOGLE_TASKS_OAUTH_STATE_COOKIE,
    state,
    googleTasksOAuthCookieOptions
  );
};

/** OAuth callback URL — never prefer localhost env on deployed hosts. */
export const resolveGoogleTasksRedirectUri = (requestOrigin?: string): string => {
  const normalizedOrigin = requestOrigin?.replace(/\/$/, "") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const derivedFromRequest = normalizedOrigin
    ? `${normalizedOrigin}/api/tasks/google/callback`
    : "";
  const derivedFromApp = appUrl
    ? `${appUrl}/api/tasks/google/callback`
    : "";
  const explicit = serverGoogleTasksConfig.oauthRedirectUri?.trim() ?? "";

  if (explicit && !explicit.includes("localhost:3333") && !isLocalhostUrl(explicit)) {
    return explicit;
  }

  if (derivedFromRequest && !isLocalhostUrl(derivedFromRequest)) {
    return derivedFromRequest;
  }

  if (derivedFromApp && !isLocalhostUrl(derivedFromApp)) {
    return derivedFromApp;
  }

  return explicit || derivedFromRequest || derivedFromApp || "http://localhost:3000/api/tasks/google/callback";
};

/** Site origin for post-OAuth redirects (never localhost env on deployed hosts). */
export const getGoogleTasksSiteOrigin = (requestOrigin?: string): string => {
  const redirect = resolveGoogleTasksRedirectUri(requestOrigin);
  try {
    return new URL(redirect).origin;
  } catch {
    /* fall through */
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !isLocalhostUrl(appUrl)) {
    return appUrl.replace(/\/$/, "");
  }
  if (requestOrigin) {
    return requestOrigin.replace(/\/$/, "");
  }
  return "http://localhost:3000";
};

const googleTasksOAuthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 10,
};

export const applyGoogleTasksOAuthOriginCookie = (
  response: NextResponse,
  origin: string
): void => {
  response.cookies.set(
    GOOGLE_TASKS_OAUTH_ORIGIN_COOKIE,
    origin.replace(/\/$/, ""),
    googleTasksOAuthCookieOptions
  );
};

export const resolveGoogleTasksPostAuthRedirect = (
  request: NextRequest,
  params: Record<string, string>
): URL => {
  const storedOrigin = request.cookies
    .get(GOOGLE_TASKS_OAUTH_ORIGIN_COOKIE)
    ?.value?.trim();
  const fallbackOrigin = getGoogleTasksSiteOrigin(
    getRequestOriginFromNextRequest(request)
  );
  let origin = fallbackOrigin;
  if (storedOrigin) {
    try {
      origin = new URL(storedOrigin).origin;
    } catch {
      origin = fallbackOrigin;
    }
  }

  const redirectUrl = new URL("/admin/tasks", origin);
  for (const [key, value] of Object.entries(params)) {
    redirectUrl.searchParams.set(key, value);
  }
  return redirectUrl;
};

export const clearGoogleTasksOAuthCookies = (response: NextResponse): void => {
  response.cookies.delete(GOOGLE_TASKS_OAUTH_STATE_COOKIE);
  response.cookies.delete(GOOGLE_TASKS_OAUTH_ORIGIN_COOKIE);
  response.cookies.delete("google_tasks_oauth_user");
};

export const signGoogleTasksOAuthUser = (email: string): string => {
  const payload = `${email}:${Date.now()}`;
  const sig = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
};

export const verifyGoogleTasksOAuthUser = (token: string): string | null => {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return null;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", getStateSecret())
      .update(payload)
      .digest("hex");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
    const [email, issuedAtRaw] = payload.split(":");
    const issuedAt = Number(issuedAtRaw);
    if (!email || !Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > 1000 * 60 * 15) return null;
    return email;
  } catch {
    return null;
  }
};
