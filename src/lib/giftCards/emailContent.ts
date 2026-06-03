import { integrations } from "@/config/integrations";
import { getGiftCardDesign, giftCardDesignEmailStyles } from "@/lib/giftCards/designs";
import { centsToDollars } from "@/lib/giftCards/validateOrder";
import type { GiftCardOrder } from "@/types/giftCard";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const buildGiftCardRecipientEmail = (order: GiftCardOrder) => {
  const amount = formatCurrency(centsToDollars(order.amountCents));
  const fromName = order.purchaser.name.trim() || "Someone special";
  const personalMessage = order.message?.trim();

  const text = [
    `Hi ${order.recipient.name},`,
    "",
    `${fromName} sent you a ${amount} eGift card for maternal wellness services at The Nesting Place.`,
    personalMessage ? `\nPersonal message:\n"${personalMessage}"\n` : "",
    "You can use this gift toward birth doula support, postpartum care, lactation consulting, prenatal massage, and other eligible services.",
    "",
    `To redeem or ask questions, contact us at ${integrations.contactEmail} or visit our website.`,
    "",
    "With care,",
    "The Nesting Place",
  ]
    .filter(Boolean)
    .join("\n");

  const design = getGiftCardDesign(order.designId);
  const html = buildGiftCardRecipientHtml({
    recipientName: order.recipient.name,
    fromName,
    amount,
    personalMessage,
    orderId: order.id,
    paidAt: order.paidAt ?? order.createdAt,
    designLabel: design.label,
    designId: order.designId,
  });

  return {
    subject: `You've received a ${amount} eGift card from ${fromName}`,
    text,
    html,
  };
};

export const buildGiftCardPurchaserCopyEmail = (order: GiftCardOrder) => {
  const amount = formatCurrency(centsToDollars(order.amountCents));
  const text = [
    `Hi ${order.purchaser.name},`,
    "",
    `Thank you for your ${amount} eGift card purchase for ${order.recipient.name} (${order.recipient.email}).`,
    "We've emailed them their gift card details.",
    "",
    `Questions? Contact ${integrations.contactEmail}.`,
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(order.purchaser.name)},</p>
    <p>Thank you for your <strong>${escapeHtml(amount)}</strong> eGift card purchase for
    ${escapeHtml(order.recipient.name)} (${escapeHtml(order.recipient.email)}).</p>
    <p>We've emailed them their gift card details.</p>
    <p>Questions? Contact <a href="mailto:${escapeHtml(integrations.contactEmail)}">${escapeHtml(integrations.contactEmail)}</a>.</p>
  `.trim();

  return {
    subject: `Copy: eGift card sent to ${order.recipient.name}`,
    text,
    html,
  };
};

export const buildGiftCardFulfillmentAlertEmail = (order: GiftCardOrder) => {
  const amount = formatCurrency(centsToDollars(order.amountCents));
  const design = getGiftCardDesign(order.designId);
  const text = [
    `Paid eGift card order ${order.id}`,
    `Amount: ${amount}`,
    `Design: ${design.label}`,
    `Recipient: ${order.recipient.name} <${order.recipient.email}>`,
    `Purchaser: ${order.purchaser.name} <${order.purchaser.email}>`,
    `Recipient email: ${order.recipient.email}`,
    order.message ? `Message: ${order.message}` : "",
    order.paymentReference ? `Stripe: ${order.paymentReference}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `eGift card paid — ${amount} for ${order.recipient.name}`,
    text,
    html: `<pre>${escapeHtml(text)}</pre>`,
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatReceiptDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(iso));

/** HTML body for recipient eGift / receipt-style email. */
export const buildGiftCardRecipientHtml = (input: {
  recipientName: string;
  fromName: string;
  amount: string;
  personalMessage?: string;
  orderId: string;
  paidAt: string;
  designLabel: string;
  designId: GiftCardOrder["designId"];
}): string => {
  const contact = escapeHtml(integrations.contactEmail);
  const styles = giftCardDesignEmailStyles[input.designId];
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f7f4f1;font-family:Georgia,'Times New Roman',serif;color:#3d3d3d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f1;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #d4e4dc;overflow:hidden;">
        <tr>
          <td style="background:${styles.headerBackground};padding:28px 32px;color:${input.designId === "blush" ? "#3d3d3d" : "#fff"};">
            <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.9;">The Nesting Place · ${escapeHtml(input.designLabel)}</p>
            <h1 style="margin:12px 0 0;font-size:26px;font-weight:600;">eGift Card</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;">Hi ${escapeHtml(input.recipientName)},</p>
            <p style="margin:0 0 24px;line-height:1.6;font-size:15px;">
              <strong>${escapeHtml(input.fromName)}</strong> sent you a
              <strong style="color:#6b8f7a;">${escapeHtml(input.amount)}</strong> gift card
              for maternal wellness services.
            </p>
            <table width="100%" style="background:#f7f4f1;border-radius:12px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${styles.accentColor};">Amount</p>
                <p style="margin:0;font-size:28px;font-weight:600;color:#3d3d3d;">${escapeHtml(input.amount)}</p>
                <p style="margin:12px 0 0;font-size:12px;color:#6b6b6b;">Order ${escapeHtml(input.orderId.slice(0, 8))}… · ${escapeHtml(formatReceiptDate(input.paidAt))}</p>
              </td></tr>
            </table>
            ${
              input.personalMessage
                ? `<p style="margin:0 0 8px;font-size:12px;color:#6b8f7a;">Personal message</p>
                   <p style="margin:0 0 24px;padding:16px;background:#faf8f6;border-left:3px solid #8fa99a;font-style:italic;line-height:1.5;">"${escapeHtml(input.personalMessage)}"</p>`
                : ""
            }
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#555;">
              Redeem toward birth doula support, postpartum care, lactation consulting, prenatal massage, and other eligible services.
            </p>
            <p style="margin:24px 0 0;font-size:13px;">
              Questions? <a href="mailto:${contact}" style="color:#6b8f7a;">${contact}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#faf8f6;border-top:1px solid #eee;font-size:12px;color:#888;">
            With care — The Nesting Place · This is not a tax invoice; payment receipt may arrive separately from Stripe.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
};
