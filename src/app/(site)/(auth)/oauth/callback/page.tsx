"use client";

import { waitForOAuthCallbackCompletion } from "@/lib/auth/completeOAuthRedirect";
import { readAuthReturnTo } from "@/config/socialAuth";
import { resolvePostAuthPath } from "@/lib/auth/postAuthNavigation";
import { configureAmplify } from "@/utils/amplifyConfig";
import { Hub } from "aws-amplify/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const decodeOAuthError = (description: string | null, error: string | null) => {
  const raw = description || error || "Sign in failed";
  return decodeURIComponent(raw.replace(/\+/g, " "));
};

const friendlyOAuthError = (detail: string) => {
  if (/attributes required/i.test(detail)) {
    return "Google sign-in could not finish because required profile fields were missing. Please try Google sign-in again.";
  }
  if (/invalid phone number/i.test(detail)) {
    return "Google sign-in could not finish due to a phone validation error. Please try again.";
  }
  return detail;
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const oauthCode = searchParams.get("code");
  const friendlyError = useMemo(() => {
    if (!oauthError) return null;
    const detail = decodeOAuthError(oauthErrorDescription, oauthError);
    return friendlyOAuthError(detail);
  }, [oauthError, oauthErrorDescription]);
  const [message, setMessage] = useState(
    friendlyError ? `${friendlyError} Redirecting…` : "Completing sign in…"
  );

  useEffect(() => {
    configureAmplify();

    if (friendlyError) {
      router.replace(`/signin?oauthError=${encodeURIComponent(friendlyError)}`);
      return;
    }

    let cancelled = false;

    const finish = async () => {
      const returnTo = readAuthReturnTo();
      const path = await resolvePostAuthPath(returnTo);
      if (!cancelled) router.replace(path);
    };

    const complete = async () => {
      try {
        if (oauthCode) {
          await waitForOAuthCallbackCompletion();
        }
        await finish();
      } catch {
        if (!cancelled) {
          setMessage("Sign-in is taking longer than expected. Redirecting…");
          router.replace(
            "/signin?oauthError=Sign-in%20timed%20out.%20Please%20try%20again."
          );
        }
      }
    };

    void complete();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        void finish();
      }
      if (payload.event === "signInWithRedirect_failure") {
        setMessage("Sign in was cancelled or failed. Redirecting…");
        router.replace("/signin?oauthError=Sign%20in%20was%20cancelled%20or%20failed");
      }
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setMessage("Still signing you in…");
      }
    }, 4000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [friendlyError, oauthCode, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-center text-nurture-charcoal/65">{message}</p>
    </div>
  );
}
