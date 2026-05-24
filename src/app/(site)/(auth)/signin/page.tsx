"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { Authenticator } from "@aws-amplify/ui-react";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emailAliasAuthServices } from "@/utils/emailAliasAuthServices";
import {
  sharedAuthComponents,
  sharedAuthFormFields,
} from "@/utils/sharedAuthUi";
import { useEffect } from "react";

const SigninPage = () => {
  const router = useRouter();

  useEffect(() => {
    const redirectIfSignedIn = async () => {
      try {
        await getCurrentUser();
        router.replace("/dashboard");
      } catch {
        // not signed in
      }
    };

    redirectIfSignedIn();

    const unsubscribe = Hub.listen("auth", async ({ payload }) => {
      if (payload.event === "signedIn") {
        try {
          await getCurrentUser();
          router.push("/dashboard");
        } catch (error) {
          console.error("Error after sign in:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <>
      <Breadcrumb pageName="Sign in" />
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-2 shadow-auth">
          <Authenticator
            initialState="signIn"
            hideSignUp
            services={emailAliasAuthServices}
            formFields={{
              ...sharedAuthFormFields,
              signIn: {
                username: {
                  label: "Username or email",
                  placeholder: "yourname or you@example.com",
                  isRequired: true,
                },
                password: {
                  label: "Password",
                  placeholder: "Enter your password",
                  isRequired: true,
                },
              },
            }}
            components={{
              ...sharedAuthComponents,
              Header() {
                return (
                  <div className="mb-6 text-center">
                    <h2 className="font-serif text-2xl font-semibold">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-nurture-charcoal/70">
                      Sign in with your username or email
                    </p>
                  </div>
                );
              },
            }}
          />
          <p className="pb-6 text-center text-sm text-nurture-charcoal/70">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-nurture-sage-dark hover:underline"
            >
              Join the collective
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SigninPage;
