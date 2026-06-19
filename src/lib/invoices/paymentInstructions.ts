import { clientInvoiceConfig } from "@/config/clientInvoices";
import {
  clientInvoicePaymentAssetUrl,
  clientInvoicePaymentDetails,
} from "@/config/clientInvoicePayments";
import type { ClientRecord } from "@/types/client";
import type { ClientService, ServiceInvoice } from "@/types/clientService";

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const paymentMemo = (invoice: ServiceInvoice, client: ClientRecord): string =>
  `${client.name.trim() || invoice.invoiceNumber} — ${invoice.invoiceNumber}`;

export const buildVenmoInvoiceInstructions = (
  invoice: ServiceInvoice,
  client: ClientRecord
): string =>
  [
    `Pay ${formatMoney(invoice.amountCents)} via Venmo to ${clientInvoicePaymentDetails.venmoHandle}.`,
    `Find us at ${clientInvoicePaymentDetails.venmoProfileUrl}.`,
    `Include invoice ${invoice.invoiceNumber} in the payment note.`,
    `Scan the Venmo QR code in this email, open ${clientInvoicePaymentDetails.venmoProfileUrl}, or search for ${clientInvoicePaymentDetails.venmoHandle} in the Venmo app.`,
  ].join(" ");

export const buildZelleInvoiceInstructions = (
  invoice: ServiceInvoice,
  client: ClientRecord
): string =>
  [
    `Pay ${formatMoney(invoice.amountCents)} via Zelle to ${clientInvoicePaymentDetails.zelleHandle}.`,
    `Memo: ${paymentMemo(invoice, client)}`,
    `Scan the Zelle QR code in this email or send to ${clientInvoicePaymentDetails.zelleHandle} in your banking app.`,
  ].join(" ");

export const buildAchInvoiceInstructions = (
  invoice: ServiceInvoice,
  client: ClientRecord
): string => {
  const { ach } = clientInvoicePaymentDetails;
  return [
    `Pay ${formatMoney(invoice.amountCents)} by ACH / bank transfer.`,
    `Bank: ${ach.bankName}`,
    `Routing number: ${ach.routingNumber}`,
    `Account number: ${ach.accountNumber}`,
    `Account name: ${ach.accountName}`,
    `Account type: ${ach.accountType}`,
    `Memo / reference: ${paymentMemo(invoice, client)}`,
  ].join("\n");
};

const qrImageHtml = (src: string, alt: string): string =>
  `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="200" style="display:block;max-width:200px;height:auto;border:0;margin:12px 0;" />`;

const detailRowHtml = (label: string, value: string): string =>
  `<tr>
    <td style="padding:6px 12px 6px 0;font-size:13px;color:#6b6560;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:#2f2a26;font-weight:600;">${escapeHtml(value)}</td>
  </tr>`;

export const buildManualPaymentHtml = (input: {
  invoice: ServiceInvoice;
  client: ClientRecord;
}): string | null => {
  const { invoice, client } = input;
  const amount = formatMoney(invoice.amountCents);
  const memo = paymentMemo(invoice, client);

  if (invoice.paymentMethod === "venmo") {
    const payUrl = invoice.paymentLink;
    const profileUrl = clientInvoicePaymentDetails.venmoProfileUrl;
    const qrUrl = clientInvoicePaymentAssetUrl(
      clientInvoicePaymentDetails.venmoQrPath
    );
    return `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#2f2a26;">
        Pay <strong>${escapeHtml(amount)}</strong> via Venmo to
        <strong>${escapeHtml(clientInvoicePaymentDetails.venmoHandle)}</strong>.
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6b6560;">
        Find us on Venmo:
        <a href="${escapeHtml(profileUrl)}" style="color:#6b8f7a;">${escapeHtml(profileUrl)}</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6b6560;">
        Include invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> in the payment note.
      </p>
      ${qrImageHtml(qrUrl, `Venmo QR code for ${clientInvoicePaymentDetails.venmoHandle}`)}
      ${
        payUrl
          ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#6b6560;">
              Or pay with amount pre-filled:
              <a href="${escapeHtml(payUrl)}" style="color:#6b8f7a;">${escapeHtml(payUrl)}</a>
            </p>`
          : ""
      }`;
  }

  if (invoice.paymentMethod === "zelle") {
    const qrUrl = clientInvoicePaymentAssetUrl(
      clientInvoicePaymentDetails.zelleQrPath
    );
    return `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#2f2a26;">
        Pay <strong>${escapeHtml(amount)}</strong> via Zelle to
        <strong>${escapeHtml(clientInvoicePaymentDetails.zelleHandle)}</strong>
        (${escapeHtml(clientInvoicePaymentDetails.ach.accountName)}).
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6b6560;">
        Memo: <strong>${escapeHtml(memo)}</strong>
      </p>
      ${qrImageHtml(qrUrl, `Zelle QR code for ${clientInvoicePaymentDetails.zelleHandle}`)}`;
  }

  if (invoice.paymentMethod === "ach") {
    const { ach } = clientInvoicePaymentDetails;
    return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#2f2a26;">
        Pay <strong>${escapeHtml(amount)}</strong> by ACH / bank transfer using the details below.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
        ${detailRowHtml("Bank name", ach.bankName)}
        ${detailRowHtml("Routing number", ach.routingNumber)}
        ${detailRowHtml("Account number", ach.accountNumber)}
        ${detailRowHtml("Account name", ach.accountName)}
        ${detailRowHtml("Account type", ach.accountType)}
        ${detailRowHtml("Memo / reference", memo)}
      </table>`;
  }

  return null;
};

export const buildCardDebitNoteHtml = (): string =>
  `<p style="margin:16px 0 0;padding-top:12px;border-top:1px solid #e8e2da;font-size:13px;line-height:1.6;color:#6b6560;">
      Prefer debit or credit? Message us at
      <a href="mailto:${escapeHtml(clientInvoiceConfig.brandEmail)}" style="color:#6b8f7a;">${escapeHtml(clientInvoiceConfig.brandEmail)}</a>
      for a unique payment link. ${escapeHtml(clientInvoicePaymentDetails.cardDebit.processingFeeNote)}
    </p>`;

export const buildCardDebitNotePlainText = (): string =>
  `Debit / credit: message ${clientInvoiceConfig.brandEmail} for a unique payment link. ${clientInvoicePaymentDetails.cardDebit.processingFeeNote}`;
