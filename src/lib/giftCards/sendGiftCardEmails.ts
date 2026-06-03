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

export type GiftCardEmailSendResult = {
  fulfillment: boolean;
  recipient: boolean;
  purchaserCopy: boolean;
  errors: string[];
};

const sendOne = async (
  label: string,
  input: Parameters<typeof sendSesEmail>[0],
  errors: string[]
): Promise<boolean> => {
  try {
    await sendSesEmail(input);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label}: ${message}`);
    console.error(`[gift-cards] ${label} email failed:`, error);
    return false;
  }
};

/** Send interim eGift emails via SES from a verified personal address. */
export const sendGiftCardEmails = async (
  order: GiftCardOrder
): Promise<GiftCardEmailSendResult> => {
  const from = serverGiftCardConfig.emailFrom;
  const result: GiftCardEmailSendResult = {
    fulfillment: false,
    recipient: false,
    purchaserCopy: false,
    errors: [],
  };

  if (!serverGiftCardConfig.emailEnabled || !from) {
    return result;
  }

  const reply = replyTo();
  const fulfillmentTo = serverGiftCardConfig.fulfillmentEmail;

  // Ops inbox first — always attempt (verified address); survives SES sandbox on recipient.
  if (fulfillmentTo) {
    const alert = buildGiftCardFulfillmentAlertEmail(order);
    result.fulfillment = await sendOne(
      "fulfillment",
      {
        from,
        to: [fulfillmentTo],
        subject: alert.subject,
        text: alert.text,
        html: alert.html,
        replyTo: reply,
      },
      result.errors
    );
  }

  const recipientEmail = buildGiftCardRecipientEmail(order);
  result.recipient = await sendOne(
    "recipient",
    {
      from,
      to: [order.recipient.email],
      subject: recipientEmail.subject,
      text: recipientEmail.text,
      html: recipientEmail.html,
      replyTo: reply,
    },
    result.errors
  );

  if (order.sendCopyToPurchaser) {
    const copy = buildGiftCardPurchaserCopyEmail(order);
    result.purchaserCopy = await sendOne(
      "purchaser_copy",
      {
        from,
        to: [order.purchaser.email],
        subject: copy.subject,
        text: copy.text,
        html: copy.html,
        replyTo: reply,
      },
      result.errors
    );
  }

  return result;
};
