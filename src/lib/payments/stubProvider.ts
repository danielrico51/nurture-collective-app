import type {
  GiftCardPaymentProvider,
  GiftCardPaymentInput,
  GiftCardPaymentResult,
} from "@/lib/payments/types";

/** Placeholder provider until Stripe, Square, or another processor is wired in. */
export const stubGiftCardPaymentProvider: GiftCardPaymentProvider = {
  id: "stub",
  async createCheckout(input: GiftCardPaymentInput): Promise<GiftCardPaymentResult> {
    return {
      provider: "stub",
      orderId: input.orderId,
      status: "pending_payment",
      paymentReference: `stub-${input.orderId}`,
      message:
        "Payment processing is not connected yet. Your order details were saved — our team will follow up to complete purchase.",
    };
  },
};
