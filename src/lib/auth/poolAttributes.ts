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

export const getMissingRequiredAttributes = (
  attributes: Record<string, string>,
  username?: string
) => {
  const merged = { ...attributes };
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
