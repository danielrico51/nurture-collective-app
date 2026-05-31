import { serverBillingConfig } from "@/config/billing";
import { serverGiftCardConfig } from "@/config/giftCards";
import { stubGiftCardPaymentProvider } from "@/lib/payments/stubProvider";
import { stripeGiftCardPaymentProvider } from "@/lib/payments/stripeProvider";
import type { GiftCardPaymentProvider, PaymentProviderId } from "@/lib/payments/types";

const resolveProvider = (providerId: PaymentProviderId): GiftCardPaymentProvider => {
  switch (providerId) {
    case "stripe":
      return stripeGiftCardPaymentProvider;
    case "square":
      throw new Error(
        "Square payments are not implemented yet. Set payment provider to stub."
      );
    case "stub":
    default:
      return stubGiftCardPaymentProvider;
  }
};

export const getGiftCardPaymentProvider = (): GiftCardPaymentProvider =>
  resolveProvider(serverGiftCardConfig.paymentProvider);

export const getBillingPaymentProvider = (): GiftCardPaymentProvider =>
  resolveProvider(serverBillingConfig.paymentProvider);
