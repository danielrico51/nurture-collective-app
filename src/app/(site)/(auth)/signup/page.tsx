"use client";

import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { Authenticator } from "@aws-amplify/ui-react";
import type { ValidatorResult } from "@aws-amplify/ui";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emailAliasAuthServices } from "@/utils/emailAliasAuthServices";
import {
  sharedAuthComponents,
  sharedAuthFormFields,
  signUpAuthHeader,
} from "@/utils/sharedAuthUi";
import { useEffect } from "react";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";
import { brands } from "@/content/site";

const SignupPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!PUBLIC_SIGNUP_ENABLED) {
      router.replace("/signin");
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!PUBLIC_SIGNUP_ENABLED) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Redirecting…</p>
      </div>
    );
  }

  return (
    <AuthPageShell
      eyebrow="For moms"
      title="Create your member account"
      subtitle={`Join ${brands.nurtureCollective.name} to access support through our provider network and growing mom concierge.`}
      highlights={[
        "Personalized member support",
        "Resources for every stage",
        "A caring community behind you",
      ]}
      footer={
        <p className="mt-6 border-t border-nurture-sage/10 pt-6 text-center text-sm text-nurture-charcoal/65">
          Already a member?{" "}
          <Link
            href="/signin"
            className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <Authenticator
        initialState="signUp"
        services={{
          ...emailAliasAuthServices,
          async validateCustomSignUp(formData) {
            const errors: ValidatorResult = {};
            if (!formData.email) {
              errors.email = "Email is required";
            }
            const username = String(
              formData["custom:username"] ?? formData.custom_username ?? ""
            ).trim();
            if (!username || username.length < 3) {
              errors["custom:username"] =
                "Username is required (at least 3 characters)";
            } else if (username.includes("@")) {
              errors["custom:username"] =
                "Username cannot be an email address";
            } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
              errors["custom:username"] =
                "Use only letters, numbers, dots, underscores, and hyphens";
            }
            if (!formData.family_name) {
              errors.family_name = "Last name is required";
            }
            if (!formData.phone_number) {
              errors.phone_number = "Phone number is required";
            }
            if (!formData.address) {
              errors.address = "Address is required";
            }
            return errors;
          },
        }}
        components={{
          ...sharedAuthComponents,
          Header: signUpAuthHeader,
        }}
        formFields={{
          ...sharedAuthFormFields,
          signUp: {
            "custom:username": {
              label: "Username",
              placeholder: "Choose a username",
              order: 1,
              isRequired: true,
            },
            given_name: {
              label: "First name",
              placeholder: "Your first name",
              order: 2,
            },
            family_name: {
              label: "Last name",
              placeholder: "Your last name",
              order: 3,
              isRequired: true,
            },
            phone_number: {
              label: "Phone",
              placeholder: "+12065550100",
              order: 4,
              isRequired: true,
            },
            address: {
              label: "Address",
              placeholder: "City, state or full mailing address",
              order: 5,
              isRequired: true,
            },
            email: {
              label: "Email",
              placeholder: "you@example.com",
              order: 6,
              isRequired: true,
            },
            password: {
              label: "Password",
              placeholder: "Create a password",
              order: 7,
              isRequired: true,
            },
            confirm_password: {
              label: "Confirm password",
              order: 8,
              isRequired: true,
            },
          },
          confirmSignUp: {
            confirmation_code: {
              label: "Verification code",
              placeholder: "Enter the code from your email",
              isRequired: true,
            },
          },
        }}
        signUpAttributes={[
          "email",
          "given_name",
          "family_name",
          "phone_number",
          "address",
        ]}
      />
    </AuthPageShell>
  );
};

export default SignupPage;
