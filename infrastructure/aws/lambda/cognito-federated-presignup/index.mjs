const PLACEHOLDER_PHONE = "+12025550100";
const PLACEHOLDER_ADDRESS = "Pending profile completion";
const LEGACY_PLACEHOLDER_PHONES = ["+10000000000"];

const isValidCognitoPhoneNumber = (value) => {
  if (!/^\+\d{10,15}$/.test(value)) return false;
  if (value.startsWith("+1")) {
    return /^\+1[2-9]\d{9}$/.test(value);
  }
  return true;
};

const isPlaceholderPhone = (value) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  if (trimmed === PLACEHOLDER_PHONE || LEGACY_PLACEHOLDER_PHONES.includes(trimmed)) {
    return true;
  }
  if (!trimmed.startsWith("+") && /^\d{8,}$/.test(trimmed)) {
    return true;
  }
  return false;
};

const isPlaceholderAddress = (value, email) => {
  if (!value) return true;
  if (value === PLACEHOLDER_ADDRESS) return true;
  if (email && value === email) return true;
  return false;
};

const deriveUsername = (attrs) => {
  const existing = attrs["custom:username"]?.trim();
  if (existing && existing.length >= 3) return existing;

  const email = attrs.email || "";
  let base = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "";
  if (base.length < 3) {
    const suffix = String(attrs.sub || Date.now()).replace(/\W/g, "").slice(-8);
    base = `user${suffix}`;
  }
  return base.slice(0, 50);
};

const readIdpAttributes = (event) => {
  const { providerType, attributes } = event.request;
  if (providerType === "SAML") {
    return { ...(attributes.samlResponse || {}) };
  }
  return {
    ...(attributes.userInfo || {}),
    ...(attributes.idToken || {}),
  };
};

const applyFederatedPlaceholders = (attrs) => {
  const email = attrs.email || "";

  if (!isValidCognitoPhoneNumber(attrs.phone_number || "")) {
    attrs.phone_number = PLACEHOLDER_PHONE;
  }

  if (isPlaceholderAddress(attrs.address, email)) {
    attrs.address = PLACEHOLDER_ADDRESS;
  }

  if (!attrs.name?.trim()) {
    const given = attrs.given_name?.trim() || "";
    const family = attrs.family_name?.trim() || "";
    const combined = [given, family].filter(Boolean).join(" ").trim();
    if (combined) attrs.name = combined;
  }

  return attrs;
};

const buildInboundFederationAttributes = (event) => {
  const idpAttributes = readIdpAttributes(event);
  const existing = event.request.userAttributes || {};
  const email = idpAttributes.email || existing.email || "";
  const mapped = {};

  // Cognito maps username=sub; userAttributesToMap must include the IdP sub claim.
  const idpSub = idpAttributes.sub;
  if (typeof idpSub === "string" && idpSub.trim()) {
    mapped.sub = idpSub.trim();
  }

  for (const key of ["email", "given_name", "family_name", "name", "picture"]) {
    const value = idpAttributes[key] || existing[key];
    if (typeof value === "string" && value.trim()) {
      mapped[key] = value.trim();
    }
  }

  const existingPhone = existing.phone_number;
  if (isValidCognitoPhoneNumber(existingPhone) && !isPlaceholderPhone(existingPhone)) {
    mapped.phone_number = existingPhone;
  } else if (isValidCognitoPhoneNumber(idpAttributes.phone_number || "")) {
    mapped.phone_number = idpAttributes.phone_number;
  } else {
    mapped.phone_number = PLACEHOLDER_PHONE;
  }

  const existingAddress = existing.address;
  if (!isPlaceholderAddress(existingAddress, email)) {
    mapped.address = existingAddress;
  } else if (!isPlaceholderAddress(idpAttributes.address, email)) {
    mapped.address = idpAttributes.address;
  } else {
    mapped.address = PLACEHOLDER_ADDRESS;
  }

  const existingUsername = existing["custom:username"]?.trim();
  if (existingUsername) {
    mapped["custom:username"] = existingUsername;
  }

  return mapped;
};

/**
 * Cognito user pools cannot relax required attributes after creation.
 * Google does not send phone_number. InboundFederation runs before Cognito
 * validates mapped attributes on sign-up; PreSignUp finalizes custom:username.
 *
 * IMPORTANT: InboundFederation also runs on every returning Google sign-in.
 * Only placeholders for brand-new users — preserve saved phone/address.
 */
export const handler = async (event) => {
  console.log("Federated auth trigger:", event.triggerSource, event.userName);

  if (event.triggerSource === "InboundFederation_ExternalProvider") {
    event.response = event.response || {};
    event.response.userAttributesToMap = buildInboundFederationAttributes(event);
    return event;
  }

  if (event.triggerSource === "PreSignUp_ExternalProvider") {
    const attrs = event.request.userAttributes;
    const email = attrs.email || "";

    if (!isValidCognitoPhoneNumber(attrs.phone_number || "")) {
      event.request.userAttributes.phone_number = PLACEHOLDER_PHONE;
    }

    if (isPlaceholderAddress(attrs.address, email)) {
      event.request.userAttributes.address = PLACEHOLDER_ADDRESS;
    }
    if (!attrs["custom:username"]) {
      event.request.userAttributes["custom:username"] = deriveUsername(attrs);
    }

    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
  }

  return event;
};
