import type { AuthenticatorProps } from "@aws-amplify/ui-react";
import { AuthCardHeader } from "@/components/Auth/AuthCardHeader";
import { ForceNewPasswordFormFields } from "@/components/Auth/ForceNewPasswordFormFields";

export const sharedAuthFormFields: AuthenticatorProps["formFields"] = {
  confirmResetPassword: {
    confirmation_code: {
      label: "Verification code",
      placeholder: "Enter the code from your email",
      isRequired: true,
      order: 1,
    },
    password: {
      label: "New password",
      placeholder: "Enter your new password",
      isRequired: true,
      order: 2,
    },
    confirm_password: {
      label: "Confirm password",
      placeholder: "Confirm your new password",
      isRequired: true,
      order: 3,
    },
  },
};

export const sharedAuthComponents: AuthenticatorProps["components"] = {
  ForceNewPassword: {
    Header() {
      return (
        <AuthCardHeader
          icon="password"
          title="Set a new password"
          subtitle="Choose a secure password to finish signing in."
        />
      );
    },
    FormFields: ForceNewPasswordFormFields,
  },
};

export const signInAuthHeader = () => (
  <AuthCardHeader
    icon="signin"
    title="Sign in"
    subtitle="Use your username or email and password."
  />
);

export const signUpAuthHeader = () => (
  <AuthCardHeader
    icon="signup"
    title="Create your account"
    subtitle="Choose a username and complete the fields below."
  />
);
