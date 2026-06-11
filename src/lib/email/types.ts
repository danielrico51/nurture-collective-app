export type EmailDeliveryProvider = "ses" | "resend";

/** ses = AWS only, resend = Resend only, auto = SES then Resend failover */
export type GiftCardEmailProviderMode = "ses" | "resend" | "auto";

export type SendEmailInput = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string[];
};

export type SendEmailResult = {
  provider: EmailDeliveryProvider;
};
