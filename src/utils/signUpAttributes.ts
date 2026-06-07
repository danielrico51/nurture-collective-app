export const isValidE164Phone = (value: string): boolean =>
  /^\+\d{10,15}$/.test(value);

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

/** Amplify ForceNewPassword joins country_code + phone_number — never pass a full E.164 string as phone_number alone. */
export const splitPhoneForAmplifyForm = (value: string) => {
  const e164 = normalizePhoneNumber(value);
  if (!isValidE164Phone(e164)) {
    return { country_code: "+1", phone_number: "" };
  }

  if (e164.startsWith("+1") && e164.length === 12) {
    return { country_code: "+1", phone_number: e164.slice(2) };
  }

  const match = e164.match(/^(\+\d{1,3})(\d+)$/);
  if (match) {
    return { country_code: match[1], phone_number: match[2] };
  }

  return { country_code: "+1", phone_number: e164.replace(/^\+/, "") };
};

/** Strip pasted numbers to the local part Amplify expects with a +1 country code. */
export const formatPhoneInputForAmplify = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  if (digits.length > 10 && digits.startsWith("1")) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
};

type AttributeMap = Record<string, string | undefined>;

export const resolveCognitoUsername = (raw: AttributeMap) => {
  const username =
    raw["custom:username"]?.trim() ?? raw.custom_username?.trim() ?? "";

  if (!username || username.length < 3) {
    throw new Error("Username is required (at least 3 characters)");
  }
  if (username.includes("@")) {
    throw new Error("Username cannot be an email address");
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    throw new Error(
      "Username can only contain letters, numbers, dots, underscores, and hyphens"
    );
  }

  return username.toLowerCase();
};

export const buildRequiredSignUpAttributes = (
  email: string,
  raw: AttributeMap
) => {
  const givenName = raw.given_name?.trim() ?? "";
  const familyName = raw.family_name?.trim() ?? "";
  const phoneNumber = normalizePhoneNumber(raw.phone_number ?? "");
  const address = raw.address?.trim() ?? "";
  const customUsername = resolveCognitoUsername(raw);
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
    "custom:username": customUsername,
  };
};
