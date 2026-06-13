export const MUTABLE_PROFILE_ATTRIBUTE_NAMES = new Set([
  "given_name",
  "family_name",
  "name",
  "address",
  "phone_number",
  "custom:username",
  "picture",
]);

export const pickMutableProfileAttributes = (
  attributes: Record<string, string>
): Record<string, string> => {
  const picked: Record<string, string> = {};

  for (const [name, value] of Object.entries(attributes)) {
    if (!MUTABLE_PROFILE_ATTRIBUTE_NAMES.has(name)) continue;
    if (typeof value !== "string") continue;
    picked[name] = value;
  }

  return picked;
};
