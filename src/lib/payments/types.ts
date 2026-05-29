export type PaymentProviderId = "stub" | "stripe" | "square";

export interface GiftCardPaymentInput {
  orderId: string;
  amountCents: number;
  currency: "USD";
  description: string;
  purchaserEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface GiftCardPaymentResult {
  provider: PaymentProviderId;
  orderId: string;
  status: "pending_payment" | "completed";
  checkoutUrl?: string;
  clientSecret?: string;
  paymentReference?: string;
  message?: string;
}

export interface GiftCardPaymentProvider {
  id: PaymentProviderId;
  createCheckout(input: GiftCardPaymentInput): Promise<GiftCardPaymentResult>;
}
