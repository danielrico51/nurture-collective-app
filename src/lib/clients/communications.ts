import "server-only";

import { randomUUID } from "crypto";
import { serverGiftCardConfig } from "@/config/giftCards";
import { recordClientCommunication } from "@/lib/clients/storage";
import { sendEmail } from "@/lib/email/sendEmail";
import type { ClientCommunication, ClientRecord } from "@/types/client";

const resolveFromAddress = (): string => {
  const explicit = process.env.CLIENT_COMMS_EMAIL_FROM?.trim();
  const name =
    process.env.CLIENT_COMMS_EMAIL_FROM_NAME?.trim() || "The Nesting Place";
  if (explicit) return `${name} <${explicit}>`;
  // Fall back to the gift-card sender, which is already verified in SES/Resend.
  return serverGiftCardConfig.emailFrom;
};

const resolveReplyTo = (): string =>
  process.env.CLIENT_COMMS_EMAIL_REPLY_TO?.trim() ||
  serverGiftCardConfig.emailReplyTo;

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const wrapHtml = (heading: string, bodyHtml: string): string => `
  <div style="font-family: Georgia, 'Times New Roman', serif; color: #2f2a26; max-width: 560px; margin: 0 auto;">
    <h2 style="color: #6b7d6a;">${heading}</h2>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 13px; color: #8a8378;">
      With care,<br />The Nesting Place team
    </p>
  </div>
`;

export const buildWelcomeEmail = (client: ClientRecord): EmailTemplate => {
  const firstName = client.name?.split(" ")[0] || "there";
  const text = `Hi ${firstName},

Welcome to The Nesting Place! We're so glad to support you. Your care team will be in touch shortly with next steps.

With care,
The Nesting Place team`;
  return {
    subject: "Welcome to The Nesting Place",
    text,
    html: wrapHtml(
      `Welcome, ${firstName}!`,
      `<p>We're so glad to support you. Your care team will be in touch shortly with next steps for getting started.</p>`
    ),
  };
};

export const buildInvoiceNotificationEmail = (
  client: ClientRecord,
  details: { amountLabel: string; description?: string }
): EmailTemplate => {
  const firstName = client.name?.split(" ")[0] || "there";
  const line = details.description ? ` for ${details.description}` : "";
  const text = `Hi ${firstName},

A new invoice${line} for ${details.amountLabel} is on its way. You'll receive it directly from our billing system shortly.

With care,
The Nesting Place team`;
  return {
    subject: "Your invoice from The Nesting Place",
    text,
    html: wrapHtml(
      "A new invoice is on its way",
      `<p>Hi ${firstName}, a new invoice${line} for <strong>${details.amountLabel}</strong> is on its way. You'll receive it directly from our billing system shortly.</p>`
    ),
  };
};

export const buildProposalFollowUpEmail = (client: ClientRecord): EmailTemplate => {
  const firstName = client.name?.split(" ")[0] || "there";
  const text = `Hi ${firstName},

Just following up on the proposal we shared. We'd love to answer any questions and help you take the next step whenever you're ready.

With care,
The Nesting Place team`;
  return {
    subject: "Following up on your proposal",
    text,
    html: wrapHtml(
      "Following up on your proposal",
      `<p>Hi ${firstName}, just following up on the proposal we shared. We'd love to answer any questions and help you take the next step whenever you're ready.</p>`
    ),
  };
};

/**
 * Send an outbound email to a client and append it to the communication log.
 * The log entry is recorded whether the send succeeds or fails.
 */
export const sendClientEmail = async (input: {
  client: ClientRecord;
  to?: string;
  subject: string;
  body: string;
  html?: string;
  templateId?: string;
  sentBy: string;
  sentByEmail: string;
}): Promise<ClientCommunication> => {
  const to = (input.to || input.client.email).trim();
  if (!to) {
    throw new Error("Client has no email address");
  }

  const from = resolveFromAddress();
  if (!from) {
    throw new Error(
      "Client email sender is not configured. Add to .env.local (see .env.example):\n" +
        "  GIFT_CARD_EMAIL_ENABLED=true\n" +
        "  GIFT_CARD_EMAIL_FROM=info@nesting-place.com\n" +
        "  GIFT_CARD_EMAIL_PROVIDER=resend\n" +
        "  RESEND_API_KEY=re_...\n" +
        "Or run: npm run setup:local-client-comms-env"
    );
  }

  const base: Omit<ClientCommunication, "storageKey"> = {
    id: randomUUID(),
    clientId: input.client.clientId,
    channel: "email",
    direction: "outbound",
    subject: input.subject,
    body: input.body,
    to,
    from,
    status: "sent",
    error: null,
    templateId: input.templateId ?? null,
    sentBy: input.sentBy,
    sentByEmail: input.sentByEmail,
    createdAt: new Date().toISOString(),
  };

  try {
    await sendEmail({
      from,
      to: [to],
      subject: input.subject,
      text: input.body,
      html: input.html,
      replyTo: [resolveReplyTo()].filter(Boolean),
    });
    return recordClientCommunication(base);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    await recordClientCommunication({
      ...base,
      status: "failed",
      error: message,
    });
    throw new Error(message);
  }
};
