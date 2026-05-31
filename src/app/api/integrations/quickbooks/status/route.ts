import { NextRequest, NextResponse } from "next/server";
import { isQuickBooksConfigured } from "@/config/quickbooks";
import { requireManagementAuth } from "@/lib/api/routeHelpers";
import { getValidQuickBooksTokens } from "@/lib/integrations/quickbooks";

export const dynamic = "force-dynamic";

/** Admin health check — confirms QuickBooks OAuth tokens are valid. */
export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  if (!isQuickBooksConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        message:
          "QuickBooks is not fully configured. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET, and QBO_REALM_ID.",
      },
      { status: 503 }
    );
  }

  try {
    const tokens = await getValidQuickBooksTokens();
    return NextResponse.json({
      ok: true,
      connected: true,
      realmId: tokens.realmId,
      expiresAt: tokens.expiresAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "QuickBooks connection check failed";
    return NextResponse.json(
      { ok: false, connected: false, message },
      { status: 502 }
    );
  }
}
