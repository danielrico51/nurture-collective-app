import type { Audience } from "@/content/site";
import {
  PROVIDER_SPECIALTY_SLUGS,
  SERVICE_SLUGS,
} from "@/types/inquiry";

export const splitFullName = (
  name: string
): { first_name: string; last_name: string } => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
  };
};

export const resolveServiceRequested = (input: {
  audience: Audience;
  serviceSlug?: string;
  specialtySlug?: string;
}): string => {
  if (input.audience === "mom") {
    return (
      SERVICE_SLUGS[input.serviceSlug ?? ""] ||
      input.serviceSlug?.trim() ||
      "General inquiry"
    );
  }
  return (
    PROVIDER_SPECIALTY_SLUGS[input.specialtySlug ?? ""] ||
    input.specialtySlug?.trim() ||
    "Provider application"
  );
};

export const SMS_CONSENT_LABEL =
  "I agree to receive text messages from The Nesting Place about my inquiry and care coordination. Message and data rates may apply. Reply STOP to opt out.";

export interface ContactFormValues {
  audience: Audience;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContact: string;
  serviceSlug?: string;
  specialtySlug?: string;
  smsConsent?: boolean;
}

export const mapContactFormToIntakeSubmit = (values: ContactFormValues) => {
  const { first_name, last_name } = splitFullName(values.name);
  const service_requested = resolveServiceRequested({
    audience: values.audience,
    serviceSlug: values.serviceSlug,
    specialtySlug: values.specialtySlug,
  });

  const messageParts = [
    values.message.trim(),
    values.preferredContact
      ? `Preferred contact: ${values.preferredContact}`
      : "",
    `Audience: ${values.audience}`,
  ].filter(Boolean);

  return {
    first_name,
    last_name,
    email: values.email.trim(),
    phone: values.phone?.trim() || undefined,
    service_requested,
    message: messageParts.join("\n\n"),
    source: "website",
    sms_consent: values.smsConsent === true,
  };
};
