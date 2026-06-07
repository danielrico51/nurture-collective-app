"use client";

import { AuthFormProvider } from "@/components/Auth/AuthFormProvider";
import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { EmailAuthAuthenticator } from "@/components/Auth/EmailAuthAuthenticator";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { brands } from "@/content/site";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { emailAliasAuthServices } from "@/utils/emailAliasAuthServices";
import {
  sharedAuthComponents,
  sharedAuthFormFields,
  signInAuthHeader,
} from "@/utils/sharedAuthUi";
import { PUBLIC_SIGNUP_ENABLED, canCreateMemberAccount } from "@/config/publicAccess";
import { buildGuestAccountSignupHref } from "@/config/intakeAccess";
import { readAuthReturnTo } from "@/config/socialAuth";
import { resolvePostAuthPath } from "@/lib/auth/postAuthNavigation";
import { useEffect, useRef } from "react";

const SigninPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryReturnTo = searchParams.get("returnTo");
  const returnToRef = useRef<string | null>(null);
  if (returnToRef.current === null) {
    returnToRef.current = queryReturnTo ?? readAuthReturnTo();
  }
  const returnTo = returnToRef.current;

  useEffect(() => {
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

    const unsubscribe = Hub.listen("auth", async ({ payload }) => {
      if (payload.event === "signedIn") {
        try {
          await getCurrentUser();
          const path = await resolvePostAuthPath(returnTo);
          router.push(path);
        } catch (error) {
          console.error("Error after sign in:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [returnTo, router]);

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle={`Sign in to your ${brands.nestingPlace.name} dashboard — member resources, intake, and updates from your support team.`}
      highlights={[
        "Secure member access",
        "Your dashboard and resources",
        "Stay connected with the team",
      ]}
      footer={
        canCreateMemberAccount() ? (
          <p className="mt-6 border-t border-nurture-sage/10 pt-6 text-center text-sm text-nurture-charcoal/65">
            New here?{" "}
            <Link
              href={buildGuestAccountSignupHref(returnTo ?? undefined)}
              className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
            >
              Create a free mom account
            </Link>
            {PUBLIC_SIGNUP_ENABLED ? (
              <>
                {" · "}
                <Link
                  href="/for-providers"
                  className="font-semibold text-nurture-sage-dark transition hover:text-nurture-charcoal hover:underline"
                >
                  Apply as provider
                </Link>
              </>
            ) : null}
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
      <AuthFormProvider mode="signIn">
        <EmailAuthAuthenticator
          mode="signIn"
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
      </AuthFormProvider>
    </AuthPageShell>
  );
};

export default SigninPage;
