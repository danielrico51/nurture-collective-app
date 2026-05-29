import { serverGiftCardConfig } from "@/config/giftCards";
import { stubGiftCardPaymentProvider } from "@/lib/payments/stubProvider";
import { stripeGiftCardPaymentProvider } from "@/lib/payments/stripeProvider";
import type { GiftCardPaymentProvider } from "@/lib/payments/types";

export const getGiftCardPaymentProvider = (): GiftCardPaymentProvider => {
  switch (serverGiftCardConfig.paymentProvider) {
    case "stripe":
      return stripeGiftCardPaymentProvider;
    case "square":
      throw new Error(
        "Square gift card payments are not implemented yet. Set GIFT_CARD_PAYMENT_PROVIDER=stub."
      );
    case "stub":
    default:
      return stubGiftCardPaymentProvider;
  }
};
