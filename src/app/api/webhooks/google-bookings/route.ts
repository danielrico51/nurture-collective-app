import { NextRequest, NextResponse } from "next/server";
import { serverBookingConfig } from "@/config/bookings";
import { serverIntegrations } from "@/config/integrations";
import { forwardToN8n } from "@/lib/webhooks/n8n";

export const dynamic = "force-dynamic";

/**
 * Placeholder for Google Workspace booking / Calendar appointment webhooks.
 * Wire App Script, Zapier, or n8n to POST here when Google Bookings is live.
 */
export async function POST(request: NextRequest) {
  const secret = serverBookingConfig.googleBookingsWebhookSecret;
  const providedSecret =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("X-Webhook-Secret");

  if (secret) {
    if (!providedSecret || providedSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const forwardPayload = {
    source: "google-bookings",
    receivedAt: new Date().toISOString(),
    event: payload,
  };

  console.info("[google-bookings] Webhook received");

  try {
    const result = await forwardToN8n(
      serverBookingConfig.n8nGoogleBookingsWebhookUrl ||
        serverIntegrations.n8nInquiryWebhookUrl,
      serverIntegrations.n8nWebhookSecret,
      forwardPayload
    );

    return NextResponse.json({ ok: true, forwarded: result.forwarded });
  } catch (error) {
    console.error("[google-bookings] n8n forward failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 502 }
    );
  }
}
