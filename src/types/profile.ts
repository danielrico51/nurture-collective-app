export interface ProfileFormData {
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  address: string;
  phoneNumber: string;
}

export const emptyProfileForm = (): ProfileFormData => ({
  username: "",
  email: "",
  givenName: "",
  familyName: "",
  address: "",
  phoneNumber: "",
});
