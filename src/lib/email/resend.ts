import { parseEmailFromHeader } from "@/lib/email/parseFrom";
import type { SendEmailInput } from "@/lib/email/types";

const RESEND_API_URL = "https://api.resend.com/emails";

export const sendResendEmail = async (
  input: SendEmailInput,
  apiKey: string
): Promise<void> => {
  const { email, displayName } = parseEmailFromHeader(input.from);
  const body = {
    from: displayName ? `${displayName} <${email}>` : email,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    reply_to: input.replyTo?.[0],
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    id?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.message ||
        `Resend API error (${response.status})`
    );
  }
};
