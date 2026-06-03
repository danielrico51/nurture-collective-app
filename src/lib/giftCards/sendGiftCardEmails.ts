import { serverGiftCardConfig } from "@/config/giftCards";
import { sendSesEmail } from "@/lib/email/ses";
import {
  buildGiftCardFulfillmentAlertEmail,
  buildGiftCardPurchaserCopyEmail,
  buildGiftCardRecipientEmail,
} from "@/lib/giftCards/emailContent";
import type { GiftCardOrder } from "@/types/giftCard";

const replyTo = () => {
  const reply = serverGiftCardConfig.emailReplyTo;
  return reply ? [reply] : undefined;
};

const isScheduledForLater = (order: GiftCardOrder) =>
  order.deliveryTiming === "scheduled" && Boolean(order.deliverOn?.trim());

/** Send interim eGift emails via SES from a verified personal address. */
export const sendGiftCardEmails = async (order: GiftCardOrder): Promise<void> => {
  const from = serverGiftCardConfig.emailFrom;
  if (!serverGiftCardConfig.emailEnabled || !from) {
    return;
  }

  if (!isScheduledForLater(order)) {
    const recipientEmail = buildGiftCardRecipientEmail(order);
    await sendSesEmail({
      from,
      to: [order.recipient.email],
      subject: recipientEmail.subject,
      text: recipientEmail.text,
      html: recipientEmail.html,
      replyTo: replyTo(),
    });
  }

  if (order.sendCopyToPurchaser && order.purchaser.email !== order.recipient.email) {
    const copy = buildGiftCardPurchaserCopyEmail(order);
    await sendSesEmail({
      from,
      to: [order.purchaser.email],
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      replyTo: replyTo(),
    });
  }

  const fulfillmentTo = serverGiftCardConfig.fulfillmentEmail;
  if (fulfillmentTo) {
    const alert = buildGiftCardFulfillmentAlertEmail(order);
    await sendSesEmail({
      from,
      to: [fulfillmentTo],
      subject: alert.subject,
      text: alert.text,
      html: alert.html,
      replyTo: replyTo(),
    });
  }
};
