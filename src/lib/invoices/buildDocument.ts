import { clientInvoiceConfig } from "@/config/clientInvoices";
import type { InvoiceServiceContext } from "@/lib/invoices/serviceContext";
import {
  buildCardDebitNoteHtml,
  buildCardDebitNotePlainText,
  buildManualPaymentHtml,
} from "@/lib/invoices/paymentInstructions";
import type { ClientRecord } from "@/types/client";
import type { ClientService, ServiceInvoice } from "@/types/clientService";

export interface InvoiceDocumentInput {
  invoice: ServiceInvoice;
  service: ClientService;
  client: ClientRecord;
  paymentLink: string | null;
  paymentInstructions: string;
  serviceContext: InvoiceServiceContext;
  /** Signed public URL for Save as PDF (insurance / records). */
  pdfDownloadUrl?: string | null;
  /** Resend of a paid invoice for insurance / records. */
  isResend?: boolean;
}

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const formatDate = (value: string | null): string => {
  if (!value) return "Upon receipt";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const buildInvoiceEmailSubject = (invoiceNumber: string): string =>
  `Invoice ${invoiceNumber} from ${clientInvoiceConfig.brandName}`;

const firstName = (name: string): string => name.trim().split(/\s+/)[0] || "there";

const buildPaymentBlock = (
  input: InvoiceDocumentInput,
  options?: { emailSafe?: boolean }
): string => {
  const { invoice, paymentLink, paymentInstructions, serviceContext } = input;
  const isPaid = serviceContext.paymentStatusLabel === "Paid";

  if (isPaid) {
    const paidLine = invoice.paidAt
      ? `Payment received on ${formatDate(invoice.paidAt.slice(0, 10))}.`
      : "Payment received.";
    return `<p style="margin:16px 0;font-size:14px;line-height:1.6;color:#2f2a26;"><strong>Paid</strong> — ${escapeHtml(paidLine)} No payment is due on this invoice.</p>`;
  }

  const manualHtml = buildManualPaymentHtml({ invoice, client: input.client });
  if (manualHtml) {
    return `${manualHtml}${buildCardDebitNoteHtml()}`;
  }

  if (paymentLink) {
    const link = escapeHtml(paymentLink);
    const buttonStyle =
      "display:inline-block;background:#6b8f7a;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:600;font-size:15px;";
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
        <tr>
          <td align="center" style="border-radius:999px;background:#6b8f7a;">
            <a href="${link}" style="${buttonStyle}">Pay ${escapeHtml(formatMoney(invoice.amountCents))} online</a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#6b6560;word-break:break-all;">
        Or copy this link:<br /><a href="${link}" style="color:#6b8f7a;">${link}</a>
      </p>
      ${buildCardDebitNoteHtml()}`;
  }

  const instructionStyle = options?.emailSafe
    ? "margin:16px 0;font-size:14px;line-height:1.6;color:#2f2a26;"
    : "white-space:pre-wrap;margin:16px 0;color:#2f2a26;";
  return `<p style="${instructionStyle}">${escapeHtml(paymentInstructions)}</p>`;
};

const buildInvoiceLineItemRows = (input: InvoiceDocumentInput): string => {
  const { invoice, service } = input;
  const subtotalCents =
    invoice.subtotalCents > 0 ? invoice.subtotalCents : invoice.amountCents;
  const serviceRow = `<tr>
            <td style="padding:14px 12px;border-top:1px solid #e8e2da;vertical-align:top;font-size:14px;line-height:1.5;color:#2f2a26;">
              <strong>${escapeHtml(invoice.description || service.title)}</strong>
              ${service.providerName ? `<br /><span style="font-size:13px;color:#6b6560;">Provider: ${escapeHtml(service.providerName)}</span>` : ""}
              ${service.serviceDate ? `<br /><span style="font-size:13px;color:#6b6560;">Service date: ${escapeHtml(formatDate(service.serviceDate))}</span>` : ""}
            </td>
            <td style="padding:14px 12px;border-top:1px solid #e8e2da;text-align:right;font-weight:600;white-space:nowrap;font-size:14px;color:#2f2a26;">
              ${escapeHtml(formatMoney(subtotalCents))}
            </td>
          </tr>`;

  if ((invoice.processingFeeCents ?? 0) <= 0) {
    return serviceRow;
  }

  const feeLabel =
    invoice.processingFeePercent != null
      ? `Processing fee (${invoice.processingFeePercent}%)`
      : "Processing fee";

  const feeRow = `<tr>
            <td style="padding:14px 12px;border-top:1px solid #e8e2da;vertical-align:top;font-size:14px;line-height:1.5;color:#6b6560;">
              ${escapeHtml(feeLabel)}
            </td>
            <td style="padding:14px 12px;border-top:1px solid #e8e2da;text-align:right;font-weight:600;white-space:nowrap;font-size:14px;color:#2f2a26;">
              ${escapeHtml(formatMoney(invoice.processingFeeCents))}
            </td>
          </tr>`;

  return `${serviceRow}${feeRow}`;
};

const statusBadgeStyle = (label: string): string => {
  if (label === "Paid") {
    return "display:inline-block;background:#ecfdf5;color:#047857;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;";
  }
  if (label === "Unpaid") {
    return "display:inline-block;background:#fffbeb;color:#b45309;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;";
  }
  return "display:inline-block;background:#f7f4f1;color:#6b6560;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;";
};

const buildInvoiceHeaderMeta = (input: InvoiceDocumentInput): string => {
  const { invoice, client, serviceContext } = input;
  const issuedDate = formatDate(
    invoice.sentAt?.slice(0, 10) ?? invoice.createdAt.slice(0, 10)
  );
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="vertical-align:top;width:50%;padding:0 12px 0 0;">
            <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Bill to</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#2f2a26;">${escapeHtml(client.name)}</p>
            ${client.email ? `<p style="margin:4px 0 0;font-size:14px;color:#6b6560;">${escapeHtml(client.email)}</p>` : ""}
            ${client.phone ? `<p style="margin:4px 0 0;font-size:14px;color:#6b6560;">${escapeHtml(client.phone)}</p>` : ""}
          </td>
          <td style="vertical-align:top;text-align:right;padding:0;">
            <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Invoice #</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#6b8f7a;">${escapeHtml(invoice.invoiceNumber)}</p>
            <p style="margin:12px 0 8px;"><span style="${statusBadgeStyle(serviceContext.paymentStatusLabel)}">${escapeHtml(serviceContext.paymentStatusLabel)}</span></p>
            <p style="margin:0;font-size:13px;color:#6b6560;">Issued ${escapeHtml(issuedDate)}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b6560;">Due ${escapeHtml(formatDate(invoice.dueDate))}</p>
          </td>
        </tr>
      </table>`;
};

const buildServiceSummaryBlock = (input: InvoiceDocumentInput): string => {
  const { service, serviceContext } = input;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;background:#f7f4f1;border-radius:12px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Service</p>
            <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#2f2a26;">${escapeHtml(service.title)}</p>
            ${service.providerName ? `<p style="margin:0 0 4px;font-size:13px;color:#6b6560;">Provider: ${escapeHtml(service.providerName)}</p>` : ""}
            ${service.serviceDate ? `<p style="margin:0 0 12px;font-size:13px;color:#6b6560;">Service date: ${escapeHtml(formatDate(service.serviceDate))}</p>` : ""}
            <p style="margin:0 0 4px;font-size:13px;color:#6b6560;">This invoice: <strong style="color:#2f2a26;">${escapeHtml(serviceContext.paymentTypeLabel)}</strong></p>
            <p style="margin:0 0 4px;font-size:13px;color:#6b6560;">Service total: <strong style="color:#2f2a26;">${escapeHtml(formatMoney(serviceContext.totalFeeCents))}</strong></p>
            <p style="margin:0 0 4px;font-size:13px;color:#6b6560;">Paid to date: <strong style="color:#2f2a26;">${escapeHtml(formatMoney(serviceContext.paidCents))}</strong></p>
            <p style="margin:0;font-size:13px;color:#6b6560;">Balance remaining: <strong style="color:#2f2a26;">${escapeHtml(formatMoney(serviceContext.balanceDueCents))}</strong></p>
          </td>
        </tr>
      </table>`;
};

const buildPaymentHistoryBlock = (input: InvoiceDocumentInput): string => {
  const { serviceContext } = input;
  if (serviceContext.paymentHistory.length === 0) return "";

  const rows = serviceContext.paymentHistory
    .map((entry) => {
      const rowStyle = entry.isCurrent ? "background:#fff8ef;" : "";
      const paidDate = entry.paidAt
        ? formatDate(entry.paidAt.slice(0, 10))
        : "—";
      return `<tr style="${rowStyle}">
          <td style="padding:10px 12px;border-top:1px solid #e8e2da;font-size:13px;color:#2f2a26;">
            ${entry.isCurrent ? "<strong>→ </strong>" : ""}${escapeHtml(entry.invoiceNumber)}
            ${entry.isCurrent ? ' <span style="color:#6b6560;">(this invoice)</span>' : ""}
            <br /><span style="color:#6b6560;">${escapeHtml(entry.description)}</span>
          </td>
          <td style="padding:10px 12px;border-top:1px solid #e8e2da;font-size:13px;text-align:right;white-space:nowrap;">${escapeHtml(formatMoney(entry.amountCents))}</td>
          <td style="padding:10px 12px;border-top:1px solid #e8e2da;font-size:13px;text-align:center;">${escapeHtml(entry.statusLabel)}</td>
          <td style="padding:10px 12px;border-top:1px solid #e8e2da;font-size:13px;text-align:right;color:#6b6560;">${escapeHtml(paidDate)}</td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td colspan="4" style="padding:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Payment history for this service</td>
        </tr>
        <tr style="background:#f7f4f1;">
          <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b6560;">Invoice</th>
          <th align="right" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b6560;">Amount</th>
          <th align="center" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b6560;">Status</th>
          <th align="right" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b6560;">Paid</th>
        </tr>
        ${rows}
      </table>`;
};

const buildInvoiceLineItemsTable = (input: InvoiceDocumentInput): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f7f4f1;">
            <th align="left" style="padding:12px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b6560;font-weight:600;">Description</th>
            <th align="right" style="padding:12px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b6560;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${buildInvoiceLineItemRows(input)}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:14px;color:#2f2a26;">Total due</td>
            <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:14px;color:#6b8f7a;">${escapeHtml(formatMoney(input.invoice.amountCents))}</td>
          </tr>
        </tfoot>
      </table>`;

const buildPdfDownloadBlock = (pdfDownloadUrl: string | null | undefined): string => {
  if (!pdfDownloadUrl) return "";
  const link = escapeHtml(pdfDownloadUrl);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;border-top:1px solid #e8e2da;">
        <tr>
          <td style="padding:20px 0 0;">
            <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">For your records</p>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#6b6560;">
              Need a PDF for insurance reimbursement? Open the link below and choose <strong>Save as PDF</strong> in the print dialog.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius:999px;border:2px solid #6b8f7a;">
                  <a href="${link}" style="display:inline-block;padding:12px 20px;color:#6b8f7a;text-decoration:none;font-weight:600;font-size:14px;">
                    Download PDF for insurance
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
};

const buildInvoiceNotesBlock = (notes: string): string => {
  const trimmed = notes.trim();
  if (!trimmed) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:#fff8ef;border:1px solid #e8dcc8;border-radius:12px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Notes</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#2f2a26;white-space:pre-wrap;">${escapeHtml(trimmed)}</p>
          </td>
        </tr>
      </table>`;
};

const buildInvoiceNotesPlainText = (notes: string): string[] => {
  const trimmed = notes.trim();
  if (!trimmed) return [];
  return ["Notes", trimmed, ""];
};

const buildPaymentHistoryPlainText = (
  input: InvoiceDocumentInput
): string[] => {
  if (input.serviceContext.paymentHistory.length === 0) return [];
  const lines = ["Payment history for this service", ""];
  for (const entry of input.serviceContext.paymentHistory) {
    const marker = entry.isCurrent ? " (this invoice)" : "";
    const paid = entry.paidAt
      ? new Date(entry.paidAt).toLocaleDateString("en-US")
      : "—";
    lines.push(
      `${entry.invoiceNumber}${marker}: ${entry.description} — ${formatMoney(entry.amountCents)} — ${entry.statusLabel} — paid ${paid}`
    );
  }
  lines.push("");
  return lines;
};

export const buildInvoicePlainText = (input: InvoiceDocumentInput): string => {
  const {
    invoice,
    service,
    client,
    paymentLink,
    paymentInstructions,
    pdfDownloadUrl,
    serviceContext,
    isResend,
  } = input;
  const greeting = firstName(client.name);
  const intro = isResend && serviceContext.paymentStatusLabel === "Paid"
    ? `Here is a copy of your paid invoice ${invoice.invoiceNumber} for your records (e.g. insurance reimbursement).`
    : `Your invoice ${invoice.invoiceNumber} from ${clientInvoiceConfig.brandName} is included below.`;
  const lines = [
    `Hi ${greeting},`,
    "",
    intro,
    "No PDF attachment — payment details are in this email.",
    "",
    `${clientInvoiceConfig.brandName}`,
    `Invoice ${invoice.invoiceNumber}`,
    `Status: ${serviceContext.paymentStatusLabel}`,
    "",
    `Bill to: ${client.name}`,
    client.email ? `Email: ${client.email}` : "",
    "",
    `Service: ${service.title}`,
    service.providerName ? `Provider: ${service.providerName}` : "",
    `This invoice: ${serviceContext.paymentTypeLabel}`,
    `Service total: ${formatMoney(serviceContext.totalFeeCents)}`,
    `Paid to date: ${formatMoney(serviceContext.paidCents)}`,
    `Balance remaining: ${formatMoney(serviceContext.balanceDueCents)}`,
    "",
    `Line item: ${invoice.description}`,
    ...(invoice.processingFeeCents > 0
      ? [
          `Service amount: ${formatMoney(invoice.subtotalCents)}`,
          `Processing fee${invoice.processingFeePercent != null ? ` (${invoice.processingFeePercent}%)` : ""}: ${formatMoney(invoice.processingFeeCents)}`,
        ]
      : []),
    `Amount due on this invoice: ${formatMoney(invoice.amountCents)}`,
    `Due date: ${formatDate(invoice.dueDate)}`,
    "",
    ...buildInvoiceNotesPlainText(invoice.notes),
    ...buildPaymentHistoryPlainText(input),
    serviceContext.paymentStatusLabel === "Paid" ? "Payment" : "Payment due",
    serviceContext.paymentStatusLabel === "Paid"
      ? paymentInstructions
      : ["venmo", "zelle", "ach"].includes(invoice.paymentMethod)
        ? `${paymentInstructions}\n\n${buildCardDebitNotePlainText()}`
        : paymentLink
          ? `Pay online: ${paymentLink}\n\n${buildCardDebitNotePlainText()}`
          : `${paymentInstructions}\n\n${buildCardDebitNotePlainText()}`,
    "",
    pdfDownloadUrl
      ? [
          "Save a PDF for insurance or your records:",
          pdfDownloadUrl,
          '(Open the link and choose "Save as PDF" in the print dialog.)',
          "",
        ].join("\n")
      : "",
    `Questions? Reply to this email or contact ${clientInvoiceConfig.brandEmail}`,
    "",
    "With care,",
    `${clientInvoiceConfig.brandName} team`,
  ];
  return lines.filter(Boolean).join("\n");
};

/** Branded HTML body optimized for email clients (Gmail, Outlook, Apple Mail). */
export const buildInvoiceEmailHtml = (input: InvoiceDocumentInput): string => {
  const { invoice, client, serviceContext, isResend } = input;
  const greeting = firstName(client.name);
  const preheader =
    serviceContext.paymentStatusLabel === "Paid"
      ? `Invoice ${invoice.invoiceNumber} — Paid — ${formatMoney(invoice.amountCents)}`
      : `Invoice ${invoice.invoiceNumber} — Unpaid — ${formatMoney(invoice.amountCents)} due ${formatDate(invoice.dueDate)}`;
  const paymentBlock = buildPaymentBlock(input, { emailSafe: true });
  const intro =
    isResend && serviceContext.paymentStatusLabel === "Paid"
      ? "Here is a copy of your paid invoice for your records — for example, insurance reimbursement."
      : "Please find your invoice below. Everything you need to pay is included in this email — no attachment required.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(buildInvoiceEmailSubject(invoice.invoiceNumber))}</title>
</head>
<body style="margin:0;padding:0;background:#f7f4f1;font-family:Georgia,'Times New Roman',serif;color:#2f2a26;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f4f1;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #e8e2da;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 32px 20px;border-bottom:1px solid #e8e2da;">
              <img src="${escapeHtml(clientInvoiceConfig.logoUrl)}" alt="${escapeHtml(clientInvoiceConfig.brandName)}" width="220" style="display:block;max-width:220px;height:auto;border:0;" />
              <p style="margin:12px 0 0;font-size:13px;color:#6b6560;letter-spacing:0.04em;text-transform:uppercase;">Invoice</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#2f2a26;">Hi ${escapeHtml(greeting)},</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b6560;">
                ${escapeHtml(intro)}
              </p>
              ${buildInvoiceHeaderMeta(input)}
              ${buildServiceSummaryBlock(input)}
              ${buildInvoiceLineItemsTable(input)}
              ${buildPaymentHistoryBlock(input)}
              ${buildInvoiceNotesBlock(invoice.notes)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f4f1;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Payment</p>
                    ${paymentBlock}
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a8378;">
                Questions about this invoice? Reply to this email or contact us at
                <a href="mailto:${escapeHtml(clientInvoiceConfig.brandEmail)}" style="color:#6b8f7a;">${escapeHtml(clientInvoiceConfig.brandEmail)}</a>.
              </p>
              ${buildPdfDownloadBlock(input.pdfDownloadUrl)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/** Printable HTML document stored for admin preview (Print / Save as PDF in browser). */
export const buildInvoiceHtmlDocument = (input: InvoiceDocumentInput): string => {
  const { invoice } = input;
  const paymentBlock = buildPaymentBlock(input);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(buildInvoiceEmailSubject(invoice.invoiceNumber))}</title>
</head>
<body style="margin:0;padding:24px;background:#f7f4f1;font-family:Georgia,'Times New Roman',serif;color:#2f2a26;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8e2da;border-radius:16px;overflow:hidden;">
    <div style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e8e2da;">
      <img src="${escapeHtml(clientInvoiceConfig.logoUrl)}" alt="${escapeHtml(clientInvoiceConfig.brandName)}" width="220" style="max-width:220px;height:auto;" />
      <p style="margin:12px 0 0;font-size:13px;color:#6b6560;letter-spacing:0.04em;text-transform:uppercase;">Invoice</p>
    </div>
    <div style="padding:32px;">
      ${buildInvoiceHeaderMeta(input)}
      ${buildServiceSummaryBlock(input)}
      ${buildInvoiceLineItemsTable(input)}
      ${buildPaymentHistoryBlock(input)}
      ${buildInvoiceNotesBlock(invoice.notes)}
      <div style="background:#f7f4f1;border-radius:12px;padding:20px;">
        <p style="margin:0 0 8px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.06em;">Payment</p>
        ${paymentBlock}
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#8a8378;">
        Questions about this invoice? Contact us at
        <a href="mailto:${escapeHtml(clientInvoiceConfig.brandEmail)}" style="color:#6b8f7a;">${escapeHtml(clientInvoiceConfig.brandEmail)}</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
};
