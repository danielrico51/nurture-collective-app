import Stripe from "stripe";
import { serverGiftCardConfig } from "@/config/giftCards";
import type {
  GiftCardPaymentProvider,
  GiftCardPaymentInput,
  GiftCardPaymentResult,
} from "@/lib/payments/types";

const getStripe = (): Stripe => {
  const key = serverGiftCardConfig.stripeSecretKey;
  if (!key) {
    throw new Error("Stripe is selected but STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(key);
};

export const stripeGiftCardPaymentProvider: GiftCardPaymentProvider = {
  id: "stripe",
  async createCheckout(input: GiftCardPaymentInput): Promise<GiftCardPaymentResult> {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.purchaserEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: {
              name: "The Nesting Place eGift Card",
              description: input.description,
            },
          },
        },
      ],
      success_url: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
      metadata: {
        orderId: input.orderId,
        orderType: "gift_card",
        ...input.metadata,
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      provider: "stripe",
      orderId: input.orderId,
      status: "pending_payment",
      checkoutUrl: session.url,
      paymentReference: session.id,
    };
  },
};
