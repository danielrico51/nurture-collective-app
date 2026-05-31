import { NextRequest, NextResponse } from "next/server";
import { serverQuickBooksConfig } from "@/config/quickbooks";
import { emitBillingEvent } from "@/lib/billing/n8nEvents";
import { verifyQuickBooksWebhookSignature } from "@/lib/integrations/quickbooks";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { QuickBooksWebhookPayload } from "@/lib/integrations/quickbooks/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("intuit-signature");

  const verifier = serverQuickBooksConfig.webhookVerifier;
  if (verifier) {
    if (!verifyQuickBooksWebhookSignature(rawBody, signature, verifier)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: QuickBooksWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as QuickBooksWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const forwardPayload = {
    source: "quickbooks",
    receivedAt,
    event: payload,
  };

  console.info("[quickbooks] Webhook received");

  try {
    const entities =
      payload.eventNotifications?.flatMap(
        (notification) => notification.dataChangeEvent?.entities ?? []
      ) ?? [];

    for (const entity of entities) {
      await emitBillingEvent({
        type: "billing.quickbooks.webhook",
        source: "quickbooks",
        order: {
          id: entity.id,
          status: "invoice_pending",
          customerEmail: "",
          lineItems: [],
          amountCents: 0,
          currency: "USD",
          createdAt: receivedAt,
          updatedAt: receivedAt,
        },
        quickbooks: {
          entity: entity.name,
          operation: entity.operation,
          invoiceId: entity.name === "Invoice" ? entity.id : undefined,
          paymentId: entity.name === "Payment" ? entity.id : undefined,
        },
      });
    }

    const billingUrl = serverQuickBooksConfig.billingWebhookUrl;
    if (billingUrl) {
      await forwardToN8n(
        billingUrl,
        serverQuickBooksConfig.billingWebhookSecret,
        forwardPayload
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[quickbooks] webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 502 }
    );
  }
}
