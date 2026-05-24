"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { Authenticator } from "@aws-amplify/ui-react";
import type { ValidatorResult } from "@aws-amplify/ui";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emailAliasAuthServices } from "@/utils/emailAliasAuthServices";
import { useEffect } from "react";

const SignupPage = () => {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <>
      <Breadcrumb pageName="Join the collective" />
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-2 shadow-auth">
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
              Header() {
                return (
                  <div className="mb-6 text-center">
                    <h2 className="font-serif text-2xl font-semibold">
                      Create your account
                    </h2>
                    <p className="mt-2 text-sm text-nurture-charcoal/70">
                      Start your pre- and postpartum care journey with us
                    </p>
                  </div>
                );
              },
            }}
            formFields={{
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
          <p className="pb-6 text-center text-sm text-nurture-charcoal/70">
            Already a member?{" "}
            <Link
              href="/signin"
              className="font-medium text-nurture-sage-dark hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
