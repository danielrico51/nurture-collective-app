/** Server-only Twilio configuration for SMS concierge webhooks. */
export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() ?? "",
  authToken: process.env.TWILIO_AUTH_TOKEN?.trim() ?? "",
  phoneNumber: process.env.TWILIO_PHONE_NUMBER?.trim() ?? "",
  /** Public webhook URL Twilio posts to (required behind proxies / Amplify). */
  smsWebhookUrl: process.env.TWILIO_SMS_WEBHOOK_URL?.trim() ?? "",
  /** Skip signature check when true (local dev only). */
  skipSignatureValidation:
    process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true",
} as const;

export const isTwilioConfigured = (): boolean =>
  Boolean(twilioConfig.accountSid && twilioConfig.authToken);

export const isTwilioSmsConciergeEnabled = (): boolean =>
  isTwilioConfigured() && Boolean(twilioConfig.phoneNumber);
