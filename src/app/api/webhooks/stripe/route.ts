import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { serverGiftCardConfig } from "@/config/giftCards";
import { completeClassRegistrationPayment } from "@/lib/classRegistrations/completePayment";
import { completeGiftCardPayment } from "@/lib/giftCards/completePayment";
import { markPurchaseOrderPaid } from "@/lib/billing/createPurchaseCheckout";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretKey = serverGiftCardConfig.stripeSecretKey;
  const webhookSecret = serverGiftCardConfig.stripeWebhookSecret;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe/webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") {
        return NextResponse.json({ ok: true, skipped: "not_paid" });
      }

      const orderId = session.metadata?.orderId?.trim();
      const orderType = session.metadata?.orderType?.trim();

      if (!orderId) {
        console.warn("[stripe/webhook] checkout.session.completed without orderId metadata");
        return NextResponse.json({ ok: true, skipped: "no_order_id" });
      }

      const paymentReference = session.payment_intent
        ? String(session.payment_intent)
        : session.id;

      if (orderType === "class_registration") {
        await completeClassRegistrationPayment({
          registrationId: orderId,
          paymentProvider: "stripe",
          paymentReference,
        });
      } else if (orderType === "billing" || session.metadata?.billing === "true") {
        await markPurchaseOrderPaid(orderId, {
          provider: "stripe",
          reference: paymentReference,
        });
      } else if (orderType === "gift_card" || session.metadata?.designId) {
        await completeGiftCardPayment({
          orderId,
          paymentProvider: "stripe",
          paymentReference,
        });
      }
    }

    return NextResponse.json({ ok: true, received: event.type });
  } catch (error) {
    console.error("[stripe/webhook] handler failed:", error);
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
