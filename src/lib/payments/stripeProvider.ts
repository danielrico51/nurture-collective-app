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

const formatStripeError = (error: unknown): string => {
  if (error instanceof Stripe.errors.StripeError) {
    if (
      error.message.includes("rak_checkout_session_write") ||
      error.message.includes("does not have the required permissions")
    ) {
      return (
        "Stripe API key is missing Checkout Sessions write permission. " +
        "In Stripe Dashboard → API keys → your restricted key → add " +
        "'Checkout Sessions' Write, or use the standard secret key (sk_live_...)."
      );
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Stripe checkout failed";
};

export const stripeGiftCardPaymentProvider: GiftCardPaymentProvider = {
  id: "stripe",
  async createCheckout(input: GiftCardPaymentInput): Promise<GiftCardPaymentResult> {
    const stripe = getStripe();

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
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
    } catch (error) {
      throw new Error(formatStripeError(error));
    }

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
