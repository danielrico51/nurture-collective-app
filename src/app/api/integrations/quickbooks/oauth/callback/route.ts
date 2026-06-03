import { NextRequest, NextResponse } from "next/server";
import {
  getQuickBooksSiteOrigin,
  isQuickBooksOAuthConfigured,
} from "@/config/quickbooks";
import { exchangeQuickBooksAuthCode } from "@/lib/integrations/quickbooks";
import { QBO_OAUTH_STATE_COOKIE } from "@/lib/integrations/quickbooks/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isQuickBooksOAuthConfigured()) {
    return NextResponse.json(
      { error: "QuickBooks OAuth is not configured" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const realmId = url.searchParams.get("realmId")?.trim();
  const oauthError = url.searchParams.get("error")?.trim();

  if (oauthError) {
    return NextResponse.json(
      { error: `QuickBooks authorization denied: ${oauthError}` },
      { status: 400 }
    );
  }

  const expectedState = request.cookies.get(QBO_OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !realmId || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: "Invalid OAuth callback — missing or mismatched state" },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeQuickBooksAuthCode(code, realmId);
    const siteOrigin = getQuickBooksSiteOrigin() || request.nextUrl.origin;
    const redirectUrl = new URL("/admin/integrations/quickbooks", siteOrigin);
    redirectUrl.searchParams.set("connected", "1");
    redirectUrl.searchParams.set("realmId", tokens.realmId);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(QBO_OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("[quickbooks/oauth/callback] failed:", error);
    const message =
      error instanceof Error ? error.message : "QuickBooks OAuth exchange failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
