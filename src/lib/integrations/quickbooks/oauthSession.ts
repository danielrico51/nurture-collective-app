import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { serverQuickBooksConfig } from "@/config/quickbooks";
import { buildQuickBooksAuthorizeUrl } from "@/lib/integrations/quickbooks/oauth";
import { QBO_OAUTH_STATE_COOKIE } from "@/lib/integrations/quickbooks/constants";

const STATE_TTL_MS = 10 * 60 * 1000;

const signOAuthPayload = (payload: string): string => {
  const secret = serverQuickBooksConfig.clientSecret;
  if (!secret) {
    throw new Error("QuickBooks client secret is not configured");
  }
  return createHmac("sha256", secret).update(payload).digest("base64url");
};

/** Signed OAuth state — survives Intuit redirect without relying on browser cookies. */
export const createQuickBooksOAuthState = (): string => {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString(36);
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${signOAuthPayload(payload)}`;
};

export const verifyQuickBooksOAuthState = (state: string): boolean => {
  const lastDot = state.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = state.slice(0, lastDot);
  const signature = state.slice(lastDot + 1);
  if (!payload || !signature) return false;

  const [issuedAtRaw, nonce] = payload.split(".", 2);
  if (!issuedAtRaw || !nonce) return false;
  const issuedAt = Number.parseInt(issuedAtRaw, 36);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > STATE_TTL_MS) return false;

  let expected = "";
  try {
    expected = signOAuthPayload(payload);
  } catch {
    return false;
  }

  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

export const applyQuickBooksOAuthStateCookie = (
  response: NextResponse,
  state: string
): void => {
  const cookieOptions: Parameters<NextResponse["cookies"]["set"]>[2] = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      const hostname = new URL(appUrl).hostname;
      if (hostname.endsWith("nesting-place.com")) {
        cookieOptions.domain = ".nesting-place.com";
      }
    } catch {
      /* ignore invalid app url */
    }
  }

  response.cookies.set(QBO_OAUTH_STATE_COOKIE, state, cookieOptions);
};

export const buildQuickBooksOAuthAuthorizeUrl = (state: string): string =>
  buildQuickBooksAuthorizeUrl(state);
