import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

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

const attributesFromCognitoUser = (user) => {
  const attrs = {};
  for (const { Name, Value } of user.UserAttributes || []) {
    attrs[Name] = Value;
  }
  return attrs;
};

const federatedUsernameCandidates = (event) => {
  const candidates = [];
  const userName = event.userName?.trim();
  if (userName) {
    candidates.push(userName);
    if (/^\d+$/.test(userName)) {
      const providerName = event.request.providerName?.trim();
      if (providerName) {
        candidates.push(`${providerName}_${userName}`);
        candidates.push(`${providerName.toLowerCase()}_${userName}`);
      }
    }
  }

  const idpSub = readIdpAttributes(event).sub?.trim();
  const providerName = event.request.providerName?.trim();
  if (providerName && idpSub) {
    candidates.push(`${providerName}_${idpSub}`);
    candidates.push(`${providerName.toLowerCase()}_${idpSub}`);
  }

  return [...new Set(candidates.filter(Boolean))];
};

export const buildNewFederatedUserAttributes = (event) => {
  const idpAttributes = readIdpAttributes(event);
  const email = idpAttributes.email || "";
  const mapped = {};

  const idpSub = idpAttributes.sub;
  if (typeof idpSub === "string" && idpSub.trim()) {
    mapped.sub = idpSub.trim();
  }

  for (const key of ["email", "given_name", "family_name", "name", "picture"]) {
    const value = idpAttributes[key];
    if (typeof value === "string" && value.trim()) {
      mapped[key] = value.trim();
    }
  }

  if (isValidCognitoPhoneNumber(idpAttributes.phone_number || "")) {
    mapped.phone_number = idpAttributes.phone_number;
  } else {
    mapped.phone_number = PLACEHOLDER_PHONE;
  }

  if (!isPlaceholderAddress(idpAttributes.address, email)) {
    mapped.address = idpAttributes.address;
  } else {
    mapped.address = PLACEHOLDER_ADDRESS;
  }

  return mapped;
};

export const buildReturningFederatedUserAttributes = (event, storedAttributes) => {
  const idpAttributes = readIdpAttributes(event);
  const email = idpAttributes.email || storedAttributes.email || "";
  const mapped = {};

  const idpSub = idpAttributes.sub;
  if (typeof idpSub === "string" && idpSub.trim()) {
    mapped.sub = idpSub.trim();
  }

  for (const key of ["email", "given_name", "family_name", "name"]) {
    const value = idpAttributes[key] || storedAttributes[key];
    if (typeof value === "string" && value.trim()) {
      mapped[key] = value.trim();
    }
  }

  const picture = storedAttributes.picture || idpAttributes.picture;
  if (typeof picture === "string" && picture.trim()) {
    mapped.picture = picture.trim();
  }

  const storedPhone = storedAttributes.phone_number;
  if (isValidCognitoPhoneNumber(storedPhone) && !isPlaceholderPhone(storedPhone)) {
    mapped.phone_number = storedPhone;
  } else if (isValidCognitoPhoneNumber(idpAttributes.phone_number || "")) {
    mapped.phone_number = idpAttributes.phone_number;
  } else {
    mapped.phone_number = PLACEHOLDER_PHONE;
  }

  const storedAddress = storedAttributes.address;
  if (!isPlaceholderAddress(storedAddress, email)) {
    mapped.address = storedAddress;
  } else if (!isPlaceholderAddress(idpAttributes.address, email)) {
    mapped.address = idpAttributes.address;
  } else {
    mapped.address = PLACEHOLDER_ADDRESS;
  }

  const storedUsername = storedAttributes["custom:username"]?.trim();
  if (storedUsername) {
    mapped["custom:username"] = storedUsername;
  }

  return mapped;
};

/**
 * InboundFederation does not include saved Cognito profile attributes in the event.
 * Returning users must re-supply required pool attributes from AdminGetUser because
 * Google does not send phone_number or address on sign-in.
 */
export const resolveInboundFederationAttributes = (event, storedAttributes) => {
  if (storedAttributes && Object.keys(storedAttributes).length > 0) {
    return buildReturningFederatedUserAttributes(event, storedAttributes);
  }
  return buildNewFederatedUserAttributes(event);
};

const loadStoredUserAttributes = async (event) => {
  const client = new CognitoIdentityProviderClient({ region: event.region });
  for (const username of federatedUsernameCandidates(event)) {
    try {
      const user = await client.send(
        new AdminGetUserCommand({
          UserPoolId: event.userPoolId,
          Username: username,
        })
      );
      return attributesFromCognitoUser(user);
    } catch (error) {
      if (error?.name === "UserNotFoundException") continue;
      throw error;
    }
  }
  return null;
};

/**
 * Cognito user pools cannot relax required attributes after creation.
 * Google does not send phone_number. InboundFederation runs before Cognito
 * validates mapped attributes on sign-up; PreSignUp finalizes custom:username.
 */
export const handler = async (event) => {
  console.log("Federated auth trigger:", event.triggerSource, event.userName);

  if (event.triggerSource === "InboundFederation_ExternalProvider") {
    event.response = event.response || {};
    const storedAttributes = await loadStoredUserAttributes(event);
    event.response.userAttributesToMap = resolveInboundFederationAttributes(
      event,
      storedAttributes
    );
    console.log(
      "InboundFederation mapped attributes:",
      JSON.stringify(event.response.userAttributesToMap)
    );
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
