import { integrations, serverIntegrations } from "@/config/integrations";
import { serverGiftCardConfig } from "@/config/giftCards";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import { sendGiftCardEmails } from "@/lib/giftCards/sendGiftCardEmails";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { GiftCardOrder } from "@/types/giftCard";

const forwardGiftCardToN8n = async (order: GiftCardOrder): Promise<void> => {
  const webhookUrl = serverIntegrations.n8nInquiryWebhookUrl;
  if (!webhookUrl) {
    return;
  }

  const amount = centsToDollars(order.amountCents);

  await forwardToN8n(webhookUrl, serverIntegrations.n8nWebhookSecret, {
    source: "gift_card_paid",
    type: "gift_card_fulfillment",
    subject: `eGift card paid — $${amount.toFixed(2)} for ${order.recipient.name}`,
    orderId: order.id,
    amountDollars: amount,
    designId: order.designId,
    deliveryTiming: order.deliveryTiming,
    deliverOn: order.deliverOn,
    purchaser: order.purchaser,
    recipient: order.recipient,
    message: order.message,
    sendCopyToPurchaser: order.sendCopyToPurchaser,
    paidAt: order.paidAt,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    contactEmail: integrations.contactEmail,
    fulfillmentEmail: serverGiftCardConfig.fulfillmentEmail || undefined,
  });
};

/** Interim fulfillment: SES from personal email + optional n8n backup. */
export const notifyGiftCardFulfillment = async (order: GiftCardOrder): Promise<void> => {
  if (serverGiftCardConfig.emailEnabled && serverGiftCardConfig.emailFrom) {
    try {
      await sendGiftCardEmails(order);
      console.info("[gift-cards] Fulfillment emails sent", {
        orderId: order.id,
        recipient: order.recipient.email,
      });
    } catch (error) {
      console.error("[gift-cards] SES email failed:", error);
    }
  } else {
    console.info(
      "[gift-cards] GIFT_CARD_EMAIL_ENABLED or GIFT_CARD_EMAIL_FROM not set — skipping SES"
    );
  }

  try {
    await forwardGiftCardToN8n(order);
  } catch (error) {
    console.error("[gift-cards] Fulfillment n8n notify failed:", error);
  }
};
