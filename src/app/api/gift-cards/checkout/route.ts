import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { createGiftCardCheckout } from "@/lib/giftCards/createOrder";
import { validateGiftCardCheckout } from "@/lib/giftCards/validateOrder";
import type { GiftCardCheckoutRequest } from "@/types/giftCard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Partial<GiftCardCheckoutRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateGiftCardCheckout(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const authed = await verifyRequest(request);
    const { order, payment } = await createGiftCardCheckout(validated.data, {
      purchaserUserId: authed?.sub,
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      status: order.status,
      provider: payment.provider,
      checkoutUrl: payment.checkoutUrl,
      clientSecret: payment.clientSecret,
      message: payment.message,
    });
  } catch (error) {
    console.error("[gift-cards/checkout] failed:", error);
    const message =
      error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
