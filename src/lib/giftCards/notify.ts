import { integrations, serverIntegrations } from "@/config/integrations";
import { serverGiftCardConfig } from "@/config/giftCards";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import { sendGiftCardEmails } from "@/lib/giftCards/sendGiftCardEmails";
import { writeGiftCardOrder } from "@/lib/giftCards/storage";
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

const emailDeliveryComplete = (order: GiftCardOrder): boolean => {
  const delivery = order.emailDelivery;
  if (!delivery?.lastAttemptAt) return false;
  if (delivery.errors?.length) return false;
  if (!delivery.recipient) return false;
  if (order.sendCopyToPurchaser && !delivery.purchaserCopy) return false;
  if (serverGiftCardConfig.fulfillmentEmail && !delivery.fulfillment) return false;
  return true;
};

/** Interim fulfillment: SES from personal email + optional n8n backup. */
export const notifyGiftCardFulfillment = async (
  order: GiftCardOrder
): Promise<GiftCardOrder> => {
  let updated = order;

  if (serverGiftCardConfig.emailEnabled && serverGiftCardConfig.emailFrom) {
    const emailResult = await sendGiftCardEmails(order);
    updated = {
      ...order,
      emailDelivery: {
        lastAttemptAt: new Date().toISOString(),
        recipient: emailResult.recipient,
        fulfillment: emailResult.fulfillment,
        purchaserCopy: emailResult.purchaserCopy,
        errors: emailResult.errors.length ? emailResult.errors : undefined,
      },
      updatedAt: new Date().toISOString(),
    };
    await writeGiftCardOrder(updated);
    console.info("[gift-cards] SES email results", {
      orderId: order.id,
      recipientEmail: order.recipient.email,
      ...emailResult,
    });
    if (emailResult.errors.length > 0) {
      console.warn("[gift-cards] Some emails failed:", emailResult.errors);
    }
  } else {
    console.info(
      "[gift-cards] GIFT_CARD_EMAIL_ENABLED or GIFT_CARD_EMAIL_FROM not set — skipping SES"
    );
  }

  try {
    await forwardGiftCardToN8n(updated);
  } catch (error) {
    console.error("[gift-cards] Fulfillment n8n notify failed:", error);
  }

  return updated;
};

export const shouldSendGiftCardEmails = (order: GiftCardOrder): boolean =>
  order.status === "paid" && !emailDeliveryComplete(order);
