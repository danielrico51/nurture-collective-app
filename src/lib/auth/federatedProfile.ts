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

export const isPlaceholderAddress = (value?: string | null): boolean => {
  const trimmed = value?.trim() ?? "";
  return !trimmed || trimmed === FEDERATED_PLACEHOLDER_ADDRESS;
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
  isPlaceholderAddress(attributes.address) ||
  !isValidCustomUsername(attributes["custom:username"]);
