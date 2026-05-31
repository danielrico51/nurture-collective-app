import { NextRequest, NextResponse } from "next/server";
import { createPurchaseCheckout } from "@/lib/billing/createPurchaseCheckout";
import { validatePurchaseCheckout } from "@/lib/billing/validateCheckout";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validatePurchaseCheckout(
    body as Parameters<typeof validatePurchaseCheckout>[0]
  );
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const { order, payment } = await createPurchaseCheckout(validated.data);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      status: order.status,
      provider: payment.provider,
      checkoutUrl: payment.checkoutUrl,
      clientSecret: payment.clientSecret,
      message: payment.message,
      quickbooks: order.quickbooks,
    });
  } catch (error) {
    console.error("[billing/checkout] failed:", error);
    const message =
      error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
