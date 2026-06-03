import { randomBytes } from "crypto";
import type { NextResponse } from "next/server";
import { buildQuickBooksAuthorizeUrl } from "@/lib/integrations/quickbooks/oauth";
import { QBO_OAUTH_STATE_COOKIE } from "@/lib/integrations/quickbooks/constants";

export const createQuickBooksOAuthState = (): string =>
  randomBytes(24).toString("hex");

export const applyQuickBooksOAuthStateCookie = (
  response: NextResponse,
  state: string
): void => {
  response.cookies.set(QBO_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
};

export const buildQuickBooksOAuthAuthorizeUrl = (state: string): string =>
  buildQuickBooksAuthorizeUrl(state);
