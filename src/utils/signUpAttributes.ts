/** Build Cognito user attributes required by the user pool schema. */
export const normalizePhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
};

type AttributeMap = Record<string, string | undefined>;

export const buildRequiredSignUpAttributes = (
  email: string,
  raw: AttributeMap
) => {
  const givenName = raw.given_name?.trim() ?? "";
  const familyName = raw.family_name?.trim() ?? "";
  const phoneNumber = normalizePhoneNumber(raw.phone_number ?? "");
  const address = raw.address?.trim() ?? "";
  const name =
    raw.name?.trim() ||
    [givenName, familyName].filter(Boolean).join(" ").trim();

  const missing: string[] = [];
  if (!familyName) missing.push("last name");
  if (!phoneNumber || !/^\+\d{10,15}$/.test(phoneNumber)) {
    missing.push("phone number (use +1 and digits, e.g. +12065550100)");
  }
  if (!address) missing.push("address");
  if (!name) missing.push("name");

  if (missing.length > 0) {
    throw new Error(`Please provide: ${missing.join(", ")}`);
  }

  return {
    email,
    ...(givenName ? { given_name: givenName } : {}),
    family_name: familyName,
    name,
    phone_number: phoneNumber,
    address,
  };
};
