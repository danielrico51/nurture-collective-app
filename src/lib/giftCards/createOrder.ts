import { randomUUID } from "crypto";
import { serverGiftCardConfig } from "@/config/giftCards";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import { writeGiftCardOrder } from "@/lib/giftCards/storage";
import { getGiftCardPaymentProvider } from "@/lib/payments/getProvider";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import type { GiftCardCheckoutRequest, GiftCardOrder } from "@/types/giftCard";

export const createGiftCardCheckout = async (input: GiftCardCheckoutRequest) => {
  const orderId = randomUUID();
  const createdAt = new Date().toISOString();

  const order: GiftCardOrder = {
    id: orderId,
    status: "pending_payment",
    amountCents: input.amountCents,
    currency: "USD",
    designId: input.designId,
    deliveryTiming: input.deliveryTiming,
    deliverOn: input.deliverOn,
    purchaser: input.purchaser,
    recipient: input.recipient,
    message: input.message,
    sendCopyToPurchaser: Boolean(input.sendCopyToPurchaser),
    createdAt,
    updatedAt: createdAt,
    quickbooks: { syncStatus: "pending" },
  };

  await writeGiftCardOrder(order);

  console.info("[gift-cards] Order created", {
    orderId,
    amount: centsToDollars(input.amountCents),
    recipientEmail: input.recipient.email,
    deliveryTiming: input.deliveryTiming,
  });

  if (serverGiftCardConfig.orderWebhookUrl) {
    try {
      await forwardToN8n(
        serverGiftCardConfig.orderWebhookUrl,
        serverGiftCardConfig.orderWebhookSecret,
        {
          type: "gift_card_order",
          order,
        }
      );
    } catch (error) {
      console.error("[gift-cards] Order webhook forward failed:", error);
    }
  }

  const provider = getGiftCardPaymentProvider();
  const payment = await provider.createCheckout({
    orderId,
    amountCents: input.amountCents,
    currency: "USD",
    description: `The Nesting Place eGift card — $${centsToDollars(input.amountCents).toFixed(2)}`,
    purchaserEmail: input.purchaser.email,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    metadata: {
      orderId,
      orderType: "gift_card",
      designId: input.designId,
      recipientEmail: input.recipient.email,
      deliveryTiming: input.deliveryTiming,
      deliverOn: input.deliverOn ?? "",
    },
  });

  const updatedOrder: GiftCardOrder = {
    ...order,
    paymentProvider: payment.provider,
    paymentReference: payment.paymentReference,
    updatedAt: new Date().toISOString(),
  };
  await writeGiftCardOrder(updatedOrder);

  return {
    order: updatedOrder,
    payment,
  };
};
