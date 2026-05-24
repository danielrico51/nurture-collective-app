import type { ProfileFormData } from "@/types/profile";

export const attributesToProfileForm = (
  attributes: Partial<Record<string, string>>
): ProfileFormData => ({
  username: attributes["custom:username"] ?? "",
  email: attributes.email ?? "",
  givenName: attributes.given_name ?? "",
  familyName: attributes.family_name ?? "",
  address: attributes.address ?? "",
  phoneNumber: attributes.phone_number ?? "",
});

export const profileFormToUserAttributes = (form: ProfileFormData) => {
  const givenName = form.givenName.trim();
  const familyName = form.familyName.trim();
  const fullName = [givenName, familyName].filter(Boolean).join(" ");

  return {
    given_name: givenName,
    family_name: familyName,
    name: fullName,
    address: form.address.trim(),
    phone_number: form.phoneNumber.trim(),
    "custom:username": form.username.trim(),
  };
};
