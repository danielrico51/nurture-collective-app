import { isFederatedPlaceholderPhone } from "@/utils/signUpAttributes";

/** Cognito flags Google/federated users should have once email and phone are real. */
export const buildFederatedVerificationAttributes = (
  attributes: Record<string, string>,
  existing: Record<string, string> = {}
): Record<string, string> => {
  const merged = { ...existing, ...attributes };
  const verification: Record<string, string> = {};

  if (merged.email?.trim() && merged.email_verified !== "true") {
    verification.email_verified = "true";
  }

  const phone = merged.phone_number?.trim();
  if (
    phone &&
    !isFederatedPlaceholderPhone(phone) &&
    merged.phone_number_verified !== "true"
  ) {
    verification.phone_number_verified = "true";
  }

  return verification;
};
