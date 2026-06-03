import { readGiftCardOrder, writeGiftCardOrder } from "@/lib/giftCards/storage";
import {
  notifyGiftCardFulfillment,
  shouldSendGiftCardEmails,
} from "@/lib/giftCards/notify";
import { syncGiftCardPaymentToQuickBooks } from "@/lib/giftCards/quickbooksSync";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import { serverGiftCardConfig } from "@/config/giftCards";
import type { GiftCardOrder } from "@/types/giftCard";

export const completeGiftCardPayment = async (input: {
  orderId: string;
  paymentProvider: string;
  paymentReference: string;
}): Promise<GiftCardOrder> => {
  const order = await readGiftCardOrder(input.orderId);
  if (!order) {
    throw new Error(`Gift card order not found: ${input.orderId}`);
  }

  if (order.status === "paid") {
    if (shouldSendGiftCardEmails(order)) {
      return notifyGiftCardFulfillment(order);
    }
    return order;
  }

  const paid: GiftCardOrder = {
    ...order,
    status: "paid",
    paymentProvider: input.paymentProvider,
    paymentReference: input.paymentReference,
    paidAt: new Date().toISOString(),
    quickbooks: order.quickbooks ?? { syncStatus: "pending" },
    updatedAt: new Date().toISOString(),
  };

  await writeGiftCardOrder(paid);

  const afterEmail = await notifyGiftCardFulfillment(paid);

  if (serverGiftCardConfig.orderWebhookUrl) {
    try {
      await forwardToN8n(
        serverGiftCardConfig.orderWebhookUrl,
        serverGiftCardConfig.orderWebhookSecret,
        {
          type: "gift_card.payment.succeeded",
          order: afterEmail,
          payment: {
            provider: input.paymentProvider,
            reference: input.paymentReference,
            amountCents: afterEmail.amountCents,
          },
        }
      );
    } catch (error) {
      console.error("[gift-cards] Payment webhook forward failed:", error);
    }
  }

  return syncGiftCardPaymentToQuickBooks(afterEmail, {
    provider: input.paymentProvider,
    reference: input.paymentReference,
  });
};
