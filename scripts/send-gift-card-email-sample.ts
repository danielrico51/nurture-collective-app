/**
 * Send sample gift card emails via SES (same templates as production).
 *
 * Usage:
 *   export GIFT_CARD_EMAIL_ENABLED=true
 *   export GIFT_CARD_EMAIL_FROM=danielrico51@gmail.com
 *   export GIFT_CARD_EMAIL_FROM_NAME="The Nesting Place"
 *   export GIFT_CARD_FULFILLMENT_EMAIL=danielrico51@gmail.com
 *   export GIFT_CARD_EMAIL_REPLY_TO=info@nesting-place.com
 *   # AWS creds with ses:SendEmail (Amplify server keys or your profile)
 *   npm run test:gift-card-email
 *
 * Optional:
 *   TEST_INBOX=you@gmail.com          — all samples go here (default: GIFT_CARD_EMAIL_FROM)
 *   TEST_SEND_RECIPIENT=1|0         — eGift to recipient template (default 1)
 *   TEST_SEND_PURCHASER=1|0         — purchaser copy (default 1)
 *   TEST_SEND_FULFILLMENT=1|0       — ops order summary (default 1)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { serverGiftCardConfig } from "../src/config/giftCards";
import { sendEmail } from "../src/lib/email/sendEmail";
import {
  buildGiftCardFulfillmentAlertEmail,
  buildGiftCardPurchaserCopyEmail,
  buildGiftCardRecipientEmail,
} from "../src/lib/giftCards/emailContent";
import { createSampleGiftCardOrder } from "../src/lib/giftCards/sampleOrder";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const truthy = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue;
  return value === "1" || value.toLowerCase() === "true";
};

const prefixSubject = (subject: string) => `[SAMPLE] ${subject}`;

const main = async () => {
  if (!serverGiftCardConfig.emailEnabled || !serverGiftCardConfig.emailFrom) {
    console.error(
      "Set GIFT_CARD_EMAIL_ENABLED=true and GIFT_CARD_EMAIL_FROM (verified sender)."
    );
    process.exit(1);
  }

  const inbox =
    process.env.TEST_INBOX?.trim() ||
    serverGiftCardConfig.fulfillmentEmail ||
    process.env.GIFT_CARD_EMAIL_FROM?.trim() ||
    "";

  if (!inbox) {
    console.error("Set TEST_INBOX or GIFT_CARD_EMAIL_FROM.");
    process.exit(1);
  }

  const order = createSampleGiftCardOrder({
    purchaser: { name: "Alex Morgan", email: inbox },
    recipient: { name: "Jordan Lee (sample)", email: inbox },
    sendCopyToPurchaser: true,
  });

  const from = serverGiftCardConfig.emailFrom;
  const replyTo = serverGiftCardConfig.emailReplyTo
    ? [serverGiftCardConfig.emailReplyTo]
    : undefined;

  const sendRecipient = truthy(process.env.TEST_SEND_RECIPIENT, true);
  const sendPurchaser = truthy(process.env.TEST_SEND_PURCHASER, true);
  const sendFulfillment = truthy(process.env.TEST_SEND_FULFILLMENT, true);

  console.log(`From: ${from}`);
  console.log(`Provider: ${serverGiftCardConfig.emailProvider}`);
  console.log(`To: ${inbox}`);
  console.log("");

  if (sendRecipient) {
    const email = buildGiftCardRecipientEmail(order);
    const sent = await sendEmail({
      from,
      to: [inbox],
      subject: prefixSubject(email.subject),
      text: `[SAMPLE] ${email.text}`,
      html: email.html,
      replyTo,
    });
    console.log(`✓ Sent recipient eGift via ${sent.provider}`);
  }

  if (sendPurchaser) {
    const copy = buildGiftCardPurchaserCopyEmail(order);
    const sent = await sendEmail({
      from,
      to: [inbox],
      subject: prefixSubject(copy.subject),
      text: `[SAMPLE] ${copy.text}`,
      html: copy.html,
      replyTo,
    });
    console.log(`✓ Sent purchaser copy via ${sent.provider}`);
  }

  if (sendFulfillment) {
    const alert = buildGiftCardFulfillmentAlertEmail(order);
    const sent = await sendEmail({
      from,
      to: [inbox],
      subject: prefixSubject(alert.subject),
      text: `[SAMPLE] ${alert.text}`,
      html: alert.html,
      replyTo,
    });
    console.log(`✓ Sent fulfillment summary via ${sent.provider}`);
  }

  console.log("\nDone. Check your inbox (and spam) for [SAMPLE] messages.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
