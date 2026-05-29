import { serverGiftCardConfig } from "@/config/giftCards";
import type {
  GiftCardPaymentProvider,
  GiftCardPaymentInput,
  GiftCardPaymentResult,
} from "@/lib/payments/types";

/**
 * Stripe Checkout integration point.
 * Install `stripe` and implement session creation when ready.
 */
export const stripeGiftCardPaymentProvider: GiftCardPaymentProvider = {
  id: "stripe",
  async createCheckout(input: GiftCardPaymentInput): Promise<GiftCardPaymentResult> {
    if (!serverGiftCardConfig.stripeSecretKey) {
      throw new Error(
        "Stripe is selected but STRIPE_SECRET_KEY is not configured."
      );
    }

    // Integration hook — replace with Stripe Checkout Session:
    // const stripe = new Stripe(serverGiftCardConfig.stripeSecretKey);
    // const session = await stripe.checkout.sessions.create({ ... });
    // return { checkoutUrl: session.url, paymentReference: session.id, ... };

    throw new Error(
      "Stripe gift card checkout is not implemented yet. Set GIFT_CARD_PAYMENT_PROVIDER=stub or complete src/lib/payments/stripeProvider.ts."
    );
  },
};
