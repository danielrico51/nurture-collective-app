"use client";

import { loadSessionUser, type SessionUser } from "@/lib/auth/sessionUser";
import { Hub } from "aws-amplify/utils";
import { useCallback, useEffect, useState } from "react";

export type SessionAuthStatus = "configuring" | "authenticated" | "unauthenticated";

/**
 * Cognito session for pages outside the Authenticator form (header, dashboard, admin).
 */
export const useSessionAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const syncAuth = useCallback(async () => {
    const sessionUser = await loadSessionUser();
    setUser(sessionUser);
    setIsAuthenticated(sessionUser !== null);
    setReady(true);
  }, []);

  useEffect(() => {
    void syncAuth();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        void syncAuth();
      }
      if (payload.event === "signedOut") {
        setUser(null);
        setIsAuthenticated(false);
        setReady(true);
      }
    });

    return () => unsubscribe();
  }, [syncAuth]);

  const authStatus: SessionAuthStatus = !ready
    ? "configuring"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  return { isAuthenticated, ready, authStatus, user };
};
