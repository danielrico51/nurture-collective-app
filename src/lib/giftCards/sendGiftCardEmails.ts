import { serverGiftCardConfig } from "@/config/giftCards";
import { sendEmail } from "@/lib/email/sendEmail";
import type { SendEmailInput } from "@/lib/email/types";
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
  providers: string[];
};

const sendOne = async (
  label: string,
  input: SendEmailInput,
  errors: string[],
  providers: string[]
): Promise<boolean> => {
  try {
    const result = await sendEmail(input);
    providers.push(`${label}:${result.provider}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label}: ${message}`);
    console.error(`[gift-cards] ${label} email failed:`, error);
    return false;
  }
};

/** Send eGift emails via SES with optional Resend failover (Plan B). */
export const sendGiftCardEmails = async (
  order: GiftCardOrder
): Promise<GiftCardEmailSendResult> => {
  const from = serverGiftCardConfig.emailFrom;
  const result: GiftCardEmailSendResult = {
    fulfillment: false,
    recipient: false,
    purchaserCopy: false,
    errors: [],
    providers: [],
  };

  if (!serverGiftCardConfig.emailEnabled || !from) {
    return result;
  }

  const reply = replyTo();
  const fulfillmentTo = serverGiftCardConfig.fulfillmentEmail;

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
      result.errors,
      result.providers
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
    result.errors,
    result.providers
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
      result.errors,
      result.providers
    );
  }

  return result;
};
