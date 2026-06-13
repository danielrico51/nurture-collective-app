import {
  isValidE164Phone,
  normalizePhoneNumber,
} from "@/utils/signUpAttributes";

/** Placeholders set by Cognito PreSignUp for federated sign-ups (see infrastructure/aws/lambda). */
export const FEDERATED_PLACEHOLDER_PHONE = "+10000000000";
export const FEDERATED_PLACEHOLDER_ADDRESS = "Pending profile completion";

export const isPlaceholderPhone = (value?: string | null): boolean => {
  const normalized = normalizePhoneNumber(value ?? "");
  return (
    !normalized ||
    normalized === FEDERATED_PLACEHOLDER_PHONE ||
    !isValidE164Phone(normalized)
  );
};

export const isPlaceholderAddress = (value?: string | null, email?: string | null): boolean => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === FEDERATED_PLACEHOLDER_ADDRESS) return true;
  // Cognito maps address=email when Google does not provide address.
  if (email && trimmed === email.trim()) return true;
  return false;
};

const isValidCustomUsername = (value?: string | null): boolean => {
  const username = value?.trim() ?? "";
  return (
    username.length >= 3 &&
    !username.includes("@") &&
    /^[a-zA-Z0-9._-]+$/.test(username)
  );
};

export const needsFederatedProfileCompletion = (
  attributes: Record<string, string | undefined>
): boolean =>
  isPlaceholderPhone(attributes.phone_number) ||
  isPlaceholderAddress(attributes.address, attributes.email) ||
  !isValidCustomUsername(attributes["custom:username"]);
