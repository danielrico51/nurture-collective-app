import { serverGiftCardConfig } from "@/config/giftCards";
import { sendResendEmail } from "@/lib/email/resend";
import { sendSesEmail } from "@/lib/email/ses";
import type {
  EmailDeliveryProvider,
  GiftCardEmailProviderMode,
  SendEmailInput,
  SendEmailResult,
} from "@/lib/email/types";

const formatSendError = (
  provider: EmailDeliveryProvider,
  error: unknown
): string => {
  const message = error instanceof Error ? error.message : String(error);
  return `${provider}: ${message}`;
};

export const resolveGiftCardEmailProvider = (
  configured: GiftCardEmailProviderMode,
  hasResendApiKey: boolean
): GiftCardEmailProviderMode => {
  if (configured === "resend" && !hasResendApiKey) {
    return "ses";
  }
  return configured;
};

/** Route gift card email through SES, Resend, or SES-then-Resend failover. */
export const sendEmail = async (
  input: SendEmailInput
): Promise<SendEmailResult> => {
  const provider = resolveGiftCardEmailProvider(
    serverGiftCardConfig.emailProvider,
    Boolean(serverGiftCardConfig.resendApiKey)
  );

  if (provider === "resend") {
    await sendResendEmail(input, serverGiftCardConfig.resendApiKey);
    return { provider: "resend" };
  }

  if (provider === "ses") {
    await sendSesEmail(input);
    return { provider: "ses" };
  }

  try {
    await sendSesEmail(input);
    return { provider: "ses" };
  } catch (sesError) {
    if (!serverGiftCardConfig.resendApiKey) {
      throw new Error(formatSendError("ses", sesError));
    }

    try {
      await sendResendEmail(input, serverGiftCardConfig.resendApiKey);
      return { provider: "resend" };
    } catch (resendError) {
      throw new Error(
        `${formatSendError("ses", sesError)} | fallback ${formatSendError("resend", resendError)}`
      );
    }
  }
};
