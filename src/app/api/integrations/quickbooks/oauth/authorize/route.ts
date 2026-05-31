import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isQuickBooksOAuthConfigured } from "@/config/quickbooks";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import { buildQuickBooksAuthorizeUrl } from "@/lib/integrations/quickbooks";
import { QBO_OAUTH_STATE_COOKIE } from "@/lib/integrations/quickbooks/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  if (!isQuickBooksOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "QuickBooks OAuth is not configured. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET, and QBO_REDIRECT_URI.",
      },
      { status: 503 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const authorizeUrl = buildQuickBooksAuthorizeUrl(state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(QBO_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
