const PLACEHOLDER_PHONE = "+10000000000";
const PLACEHOLDER_ADDRESS = "Pending profile completion";

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

/**
 * Cognito user pools cannot relax required attributes after creation.
 * Federated IdPs (Google) do not send phone_number or address, so we inject
 * placeholders here and collect real values in /signup/complete-profile.
 */
export const handler = async (event) => {
  if (event.triggerSource === "PreSignUp_ExternalProvider") {
    const attrs = event.request.userAttributes;

    if (!attrs.phone_number) {
      event.request.userAttributes.phone_number = PLACEHOLDER_PHONE;
    }
    if (!attrs.address) {
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
