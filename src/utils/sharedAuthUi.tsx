import type { AuthenticatorProps } from "@aws-amplify/ui-react";
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
        <div className="mb-4 text-center">
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Set a new password
          </h2>
          <p className="mt-2 text-sm text-nurture-charcoal/70">
            Choose a new password for your account.
          </p>
        </div>
      );
    },
    FormFields: ForceNewPasswordFormFields,
  },
};
