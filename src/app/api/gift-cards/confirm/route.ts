import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { serverGiftCardConfig } from "@/config/giftCards";
import { completeGiftCardPayment } from "@/lib/giftCards/completePayment";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import { readGiftCardOrder } from "@/lib/giftCards/storage";

export const dynamic = "force-dynamic";

/** Confirm Stripe Checkout after redirect (backup if webhook is delayed). */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const secretKey = serverGiftCardConfig.stripeSecretKey;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId?.trim();

    if (!orderId) {
      return NextResponse.json({ error: "Order not found on session" }, { status: 404 });
    }

    if (session.payment_status === "paid") {
      await completeGiftCardPayment({
        orderId,
        paymentProvider: "stripe",
        paymentReference: session.payment_intent
          ? String(session.payment_intent)
          : session.id,
      });
    }

    const order = await readGiftCardOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      status: order.status,
      quickbooks: order.quickbooks,
      summary:
        order.status === "paid"
          ? {
              amountDollars: centsToDollars(order.amountCents),
              recipientName: order.recipient.name,
              recipientEmail: order.recipient.email,
              sendCopyToPurchaser: order.sendCopyToPurchaser,
            }
          : undefined,
    });
  } catch (error) {
    console.error("[gift-cards/confirm] failed:", error);
    const message = error instanceof Error ? error.message : "Could not confirm payment";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
