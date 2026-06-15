import { brands } from "@/content/site";
import { serverGiftCardConfig } from "@/config/giftCards";

const readEnabled = () => {
  const explicit = process.env.CLASS_REGISTRATION_EMAIL_ENABLED?.trim();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return serverGiftCardConfig.emailEnabled;
};

const readVenmoHandle = () =>
  process.env.CLASS_REGISTRATION_VENMO_HANDLE?.trim() ||
  process.env.NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE?.trim() ||
  "";

const readStripeEnabled = () => {
  const explicit = process.env.CLASS_REGISTRATION_STRIPE_ENABLED?.trim();
  if (explicit === "false") return false;
  return Boolean(serverGiftCardConfig.stripeSecretKey);
};

/** Server-only class registration email configuration. */
export const classRegistrationEmailConfig = {
  emailEnabled: readEnabled(),
  emailFrom: serverGiftCardConfig.emailFrom,
  emailReplyTo: serverGiftCardConfig.emailReplyTo,
  emailProvider: serverGiftCardConfig.emailProvider,
  resendApiKey: serverGiftCardConfig.resendApiKey,
  adminEmail:
    process.env.CLASS_REGISTRATION_ADMIN_EMAIL?.trim() ||
    serverGiftCardConfig.fulfillmentEmail ||
    brands.nestingPlace.email,
} as const;

export const classRegistrationPaymentConfig = {
  stripeEnabled: readStripeEnabled(),
  venmoEnabled: Boolean(readVenmoHandle()),
  venmoHandle: readVenmoHandle(),
  stripeSecretKey: serverGiftCardConfig.stripeSecretKey,
} as const;

/** Public hints for class registration checkout UI. */
export const classRegistrationCheckoutConfig = {
  paymentsEnabled:
    process.env.NEXT_PUBLIC_CLASS_REGISTRATION_PAYMENTS_ENABLED?.trim() ===
      "true" ||
    Boolean(process.env.NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE?.trim()),
  stripeEnabled:
    process.env.NEXT_PUBLIC_CLASS_REGISTRATION_STRIPE_ENABLED?.trim() !==
      "false" &&
    process.env.NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED?.trim() === "true",
  venmoHandle:
    process.env.NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE?.trim() || "",
} as const;

export const hasClassRegistrationEmailDelivery = () => {
  if (
    !classRegistrationEmailConfig.emailEnabled ||
    !classRegistrationEmailConfig.emailFrom
  ) {
    return false;
  }
  if (
    classRegistrationEmailConfig.emailProvider === "resend" &&
    !classRegistrationEmailConfig.resendApiKey
  ) {
    return false;
  }
  return true;
};
