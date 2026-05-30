"use client";

import { readAuthReturnTo } from "@/config/socialAuth";
import { resolvePostAuthPath } from "@/lib/auth/postAuthNavigation";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
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
        router.replace("/signin");
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
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-center text-nurture-charcoal/65">{message}</p>
    </div>
  );
}
