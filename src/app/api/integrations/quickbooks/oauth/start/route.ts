import { NextRequest, NextResponse } from "next/server";
import {
  isQuickBooksOAuthConfigured,
  resolveQuickBooksRedirectUri,
} from "@/config/quickbooks";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import {
  applyQuickBooksOAuthStateCookie,
  buildQuickBooksOAuthAuthorizeUrl,
  createQuickBooksOAuthState,
} from "@/lib/integrations/quickbooks/oauthSession";

export const dynamic = "force-dynamic";

/**
 * Starts QuickBooks OAuth for signed-in admins.
 * Returns JSON + sets state cookie — use from /admin/integrations/quickbooks (not a bare browser tab).
 */
export async function POST(request: NextRequest) {
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

  const state = createQuickBooksOAuthState();
  const authorizeUrl = buildQuickBooksOAuthAuthorizeUrl(state);

  const response = NextResponse.json({
    ok: true,
    authorizeUrl,
    redirectUri: resolveQuickBooksRedirectUri(),
  });
  applyQuickBooksOAuthStateCookie(response, state);
  return response;
}
