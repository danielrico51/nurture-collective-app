"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { Authenticator } from "@aws-amplify/ui-react";
import type { ValidatorResult } from "@aws-amplify/ui";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
            services={{
              async validateCustomSignUp(formData) {
                const errors: ValidatorResult = {};
                if (!formData.email) {
                  errors.email = "Email is required";
                }
                return errors;
              },
            }}
            formFields={{
              signUp: {
                given_name: {
                  label: "First name",
                  placeholder: "Your first name",
                  order: 1,
                },
                family_name: {
                  label: "Last name",
                  placeholder: "Your last name",
                  order: 2,
                },
                email: {
                  label: "Email",
                  placeholder: "you@example.com",
                  order: 3,
                  isRequired: true,
                },
                password: {
                  label: "Password",
                  placeholder: "Create a password",
                  order: 4,
                  isRequired: true,
                },
                confirm_password: {
                  label: "Confirm password",
                  order: 5,
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
            signUpAttributes={["email", "given_name", "family_name"]}
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
