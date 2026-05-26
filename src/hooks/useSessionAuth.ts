"use client";

import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useEffect, useState } from "react";

export type SessionAuthStatus = "configuring" | "authenticated" | "unauthenticated";

/**
 * Reliable Cognito session detection for pages outside the Authenticator form.
 * Prefer this over useAuthenticator() on marketing and redirect routes.
 */
export const useSessionAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setReady(true);
      }
    };

    syncAuth();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        setIsAuthenticated(true);
        setReady(true);
      }
      if (payload.event === "signedOut") {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const authStatus: SessionAuthStatus = !ready
    ? "configuring"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  return { isAuthenticated, ready, authStatus };
};
