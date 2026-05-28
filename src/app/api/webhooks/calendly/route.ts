import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { serverBookingConfig } from "@/config/bookings";
import { serverIntegrations } from "@/config/integrations";
import {
  notifyConsultBooked,
  parseCalendlyConsultBooked,
} from "@/lib/integrations/slack";
import { forwardToN8n } from "@/lib/webhooks/n8n";

export const dynamic = "force-dynamic";

const verifyCalendlySignature = (
  rawBody: string,
  signatureHeader: string,
  signingKey: string
): boolean => {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key, rest.join("=")];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", signingKey)
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const signingKey = serverBookingConfig.calendlySigningKey;
  const signatureHeader = request.headers.get("Calendly-Webhook-Signature");

  if (signingKey) {
    if (!signatureHeader) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    if (!verifyCalendlySignature(rawBody, signatureHeader, signingKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const forwardPayload = {
    source: "calendly",
    receivedAt: new Date().toISOString(),
    event: payload,
  };

  console.info("[calendly] Webhook received");

  const consultDetails = parseCalendlyConsultBooked(payload);
  if (consultDetails) {
    void notifyConsultBooked(consultDetails).catch((error) => {
      console.error("[calendly] Slack notification failed:", error);
    });
  }

  try {
    const result = await forwardToN8n(
      serverBookingConfig.n8nCalendlyWebhookUrl ||
        process.env.N8N_INQUIRY_WEBHOOK_URL?.trim() ||
        "",
      serverIntegrations.n8nWebhookSecret,
      forwardPayload
    );

    return NextResponse.json({ ok: true, forwarded: result.forwarded });
  } catch (error) {
    console.error("[calendly] n8n forward failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 502 }
    );
  }
}
