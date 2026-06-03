import { NextRequest, NextResponse } from "next/server";
import { isQuickBooksOAuthConfigured } from "@/config/quickbooks";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import {
  getValidQuickBooksTokens,
  readQuickBooksTokens,
} from "@/lib/integrations/quickbooks";

export const dynamic = "force-dynamic";

/** Admin health check — confirms QuickBooks OAuth tokens are stored and valid. */
export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  if (!isQuickBooksOAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        message:
          "QuickBooks is not configured. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET, and QBO_REDIRECT_URI.",
      },
      { status: 503 }
    );
  }

  const stored = await readQuickBooksTokens();
  if (!stored?.refreshToken) {
    return NextResponse.json({
      ok: true,
      connected: false,
      message: "No QuickBooks connection yet. Click Connect QuickBooks.",
    });
  }

  try {
    const tokens = await getValidQuickBooksTokens();
    return NextResponse.json({
      ok: true,
      connected: true,
      realmId: tokens.realmId,
      expiresAt: tokens.expiresAt,
      updatedAt: tokens.updatedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "QuickBooks connection check failed";
    return NextResponse.json({
      ok: false,
      connected: false,
      realmId: stored.realmId,
      message,
    });
  }
}
