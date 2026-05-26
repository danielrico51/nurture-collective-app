"use client";

import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { Authenticator } from "@aws-amplify/ui-react";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { brands } from "@/content/site";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emailAliasAuthServices } from "@/utils/emailAliasAuthServices";
import {
  sharedAuthComponents,
  sharedAuthFormFields,
  signInAuthHeader,
} from "@/utils/sharedAuthUi";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";
import { resolveMemberHomePath } from "@/lib/intake/memberNavigation";
import { useEffect } from "react";

const SigninPage = () => {
  const router = useRouter();

  useEffect(() => {
    const redirectIfSignedIn = async () => {
      try {
        await getCurrentUser();
        const path = await resolveMemberHomePath();
        router.replace(path);
      } catch {
        // not signed in
      }
    };

    redirectIfSignedIn();

    const unsubscribe = Hub.listen("auth", async ({ payload }) => {
      if (payload.event === "signedIn") {
        try {
          await getCurrentUser();
          const path = await resolveMemberHomePath();
          router.push(path);
        } catch (error) {
          console.error("Error after sign in:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle={`Sign in to your ${brands.nurtureCollective.name} dashboard — member resources, intake, and updates from your care team.`}
      highlights={[
        "Secure member access",
        "Your dashboard and resources",
        "Stay connected with the team",
      ]}
      footer={
        PUBLIC_SIGNUP_ENABLED ? (
          <p className="mt-6 border-t border-nurture-sage/10 pt-6 text-center text-sm text-nurture-charcoal/65">
            New here?{" "}
            <Link
              href="/signup/mom"
              className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
            >
              Create a mom account
            </Link>
            {" · "}
            <Link
              href="/for-providers"
              className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
            >
              Apply as provider
            </Link>
          </p>
        ) : (
          <p className="mt-6 border-t border-nurture-sage/10 pt-6 text-center text-sm text-nurture-charcoal/55">
            Need access?{" "}
            <Link
              href="/contact"
              className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
            >
              Contact us
            </Link>
          </p>
        )
      }
    >
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
          Header: signInAuthHeader,
        }}
      />
    </AuthPageShell>
  );
};

export default SigninPage;
