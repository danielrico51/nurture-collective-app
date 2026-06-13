"use client";

import { readAuthReturnTo } from "@/config/socialAuth";
import { resolvePostAuthPath } from "@/lib/auth/postAuthNavigation";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const decodeOAuthError = (description: string | null, error: string | null) => {
  const raw = description || error || "Sign in failed";
  return decodeURIComponent(raw.replace(/\+/g, " "));
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");

    if (oauthError) {
      const detail = decodeOAuthError(oauthErrorDescription, oauthError);
      const friendly = /attributes required/i.test(detail)
        ? "Google sign-in needs a quick profile step, but Cognito rejected the account before sign-in finished. Please try Google sign-in again."
        : detail;

      setMessage(`${friendly} Redirecting…`);
      const timeout = window.setTimeout(() => {
        router.replace(
          `/signin?oauthError=${encodeURIComponent(friendly)}`
        );
      }, 2500);
      return () => window.clearTimeout(timeout);
    }

    let cancelled = false;

    const finish = async () => {
      const returnTo = readAuthReturnTo();
      const path = await resolvePostAuthPath(returnTo);
      if (!cancelled) router.replace(path);
    };

    const tryFinish = async () => {
      try {
        await getCurrentUser();
        await finish();
      } catch {
        /* wait for Hub signedIn after Amplify parses the OAuth response */
      }
    };

    void tryFinish();

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

    const failTimeout = window.setTimeout(() => {
      if (!cancelled) {
        setMessage("Sign-in is taking longer than expected. Redirecting…");
        router.replace("/signin?oauthError=Sign-in%20timed%20out.%20Please%20try%20again.");
      }
    }, 20000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearTimeout(timeout);
      window.clearTimeout(failTimeout);
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-center text-nurture-charcoal/65">{message}</p>
    </div>
  );
}
