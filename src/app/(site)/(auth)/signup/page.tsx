"use client";

import { AuthFormProvider } from "@/components/Auth/AuthFormProvider";
import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { EmailAuthAuthenticator } from "@/components/Auth/EmailAuthAuthenticator";
import type { ValidatorResult } from "@aws-amplify/ui";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { emailAliasAuthServices } from "@/utils/emailAliasAuthServices";
import {
  sharedAuthComponents,
  sharedAuthFormFields,
  signUpAuthHeader,
} from "@/utils/sharedAuthUi";
import { useEffect } from "react";
import { buildGuestAccountSigninHref } from "@/config/intakeAccess";
import { canCreateMemberAccount } from "@/config/publicAccess";
import { resolvePostAuthPath } from "@/lib/auth/postAuthNavigation";
import { brands } from "@/content/site";

const SignupPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    if (!canCreateMemberAccount()) {
      router.replace("/signin");
      return;
    }

    const redirectIfSignedIn = async () => {
      try {
        await getCurrentUser();
        const path = await resolvePostAuthPath(returnTo);
        router.replace(path);
      } catch {
        // not signed in
      }
    };

    redirectIfSignedIn();
  }, [returnTo, router]);

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        void resolvePostAuthPath(returnTo).then((path) => router.push(path));
      }
    });

    return () => unsubscribe();
  }, [returnTo, router]);

  if (!canCreateMemberAccount()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Redirecting…</p>
      </div>
    );
  }

  return (
    <AuthPageShell
      layout="centered"
      title="Sign up"
      subtitle={`Create your ${brands.nestingPlace.name} member account.`}
      footer={
        <p className="mt-4 border-t border-nurture-sage/10 pt-4 text-center text-sm text-nurture-charcoal/65">
          Already a member?{" "}
          <Link
            href={buildGuestAccountSigninHref(returnTo ?? undefined)}
            className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthFormProvider mode="signUp">
        <EmailAuthAuthenticator
          mode="signUp"
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
          ConfirmSignUp: {
            Header() {
              return (
                <div className="mb-4 text-center">
                  <p className="font-serif text-xl font-semibold text-nurture-charcoal">
                    Check your email
                  </p>
                  <p className="mt-2 text-sm text-nurture-charcoal/70">
                    Enter the verification code we sent. If you don&apos;t see it
                    within a few minutes, check your spam or promotions folder.
                  </p>
                </div>
              );
            },
          },
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
      </AuthFormProvider>
    </AuthPageShell>
  );
};

export default SignupPage;
