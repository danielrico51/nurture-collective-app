import { integrations } from "@/config/integrations";
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

  const html = `
    <p>Hi ${escapeHtml(order.recipient.name)},</p>
    <p><strong>${escapeHtml(fromName)}</strong> sent you a <strong>${escapeHtml(amount)}</strong> eGift card for maternal wellness services at The Nesting Place.</p>
    ${
      personalMessage
        ? `<p><em>Personal message:</em><br/>"${escapeHtml(personalMessage)}"</p>`
        : ""
    }
    <p>You can use this gift toward birth doula support, postpartum care, lactation consulting, prenatal massage, and other eligible services.</p>
    <p>To redeem or ask questions, email <a href="mailto:${escapeHtml(integrations.contactEmail)}">${escapeHtml(integrations.contactEmail)}</a>.</p>
    <p>With care,<br/>The Nesting Place</p>
  `.trim();

  return {
    subject: `You've received a ${amount} eGift card from ${fromName}`,
    text,
    html,
  };
};

export const buildGiftCardPurchaserCopyEmail = (order: GiftCardOrder) => {
  const amount = formatCurrency(centsToDollars(order.amountCents));
  const scheduled =
    order.deliveryTiming === "scheduled" && order.deliverOn
      ? `Their gift card email is scheduled for ${order.deliverOn}.`
      : "We've emailed them their gift card details.";
  const text = [
    `Hi ${order.purchaser.name},`,
    "",
    `Thank you for your ${amount} eGift card purchase for ${order.recipient.name} (${order.recipient.email}).`,
    scheduled,
    "",
    `Questions? Contact ${integrations.contactEmail}.`,
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(order.purchaser.name)},</p>
    <p>Thank you for your <strong>${escapeHtml(amount)}</strong> eGift card purchase for
    ${escapeHtml(order.recipient.name)} (${escapeHtml(order.recipient.email)}).</p>
    <p>${escapeHtml(scheduled)}</p>
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
  const scheduled =
    order.deliveryTiming === "scheduled" && order.deliverOn
      ? `SCHEDULED — send recipient email on ${order.deliverOn} (not sent automatically yet).`
      : "Recipient email sent automatically (if SES succeeded).";
  const text = [
    `Paid eGift card order ${order.id}`,
    `Amount: ${amount}`,
    `Recipient: ${order.recipient.name} <${order.recipient.email}>`,
    `Purchaser: ${order.purchaser.name} <${order.purchaser.email}>`,
    `Delivery: ${order.deliveryTiming}${order.deliverOn ? ` (${order.deliverOn})` : ""}`,
    scheduled,
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
