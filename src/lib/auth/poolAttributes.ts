export const POOL_REQUIRED_ATTRIBUTE_NAMES = [
  "address",
  "email",
  "family_name",
  "name",
  "phone_number",
  "given_name",
  "custom:username",
] as const;

export type PoolRequiredAttributeName =
  (typeof POOL_REQUIRED_ATTRIBUTE_NAMES)[number];

export const POOL_ATTRIBUTE_LABELS: Record<PoolRequiredAttributeName, string> =
  {
    address: "Address",
    email: "Email",
    family_name: "Last name",
    name: "Full name",
    phone_number: "Phone (+1…)",
    given_name: "First name",
    "custom:username": "Username",
  };

import {
  isValidE164Phone,
  normalizePhoneNumber,
} from "@/utils/signUpAttributes";

/** Drop malformed stored phones so the challenge form can recollect them. */
export const sanitizePoolAttributes = (
  attributes: Record<string, string>
): Record<string, string> => {
  const sanitized = { ...attributes };

  if (sanitized.phone_number) {
    const normalized = normalizePhoneNumber(sanitized.phone_number);
    if (isValidE164Phone(normalized)) {
      sanitized.phone_number = normalized;
    } else {
      delete sanitized.phone_number;
    }
  }

  return sanitized;
};

export const getMissingRequiredAttributes = (
  attributes: Record<string, string>,
  username?: string
) => {
  const merged = sanitizePoolAttributes(attributes);
  if (!merged["custom:username"]?.trim() && username) {
    merged["custom:username"] = username;
  }

  const existing: Record<string, string> = {};
  const missing: PoolRequiredAttributeName[] = [];

  for (const name of POOL_REQUIRED_ATTRIBUTE_NAMES) {
    const value = merged[name]?.trim();
    if (value) {
      existing[name] = value;
    } else {
      missing.push(name);
    }
  }

  return { existing, missing };
};
