"use client";

import { useSessionAuth } from "@/hooks/useSessionAuth";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Requires a signed-in member (any authenticated user, including admins). */
export const useRequireMember = () => {
  const router = useRouter();
  const { authStatus, user, ready: sessionReady } = useSessionAuth();
  const { canAccessAdmin, loading: groupsLoading } = useUserGroups(
    authStatus === "authenticated"
  );

  useEffect(() => {
    if (sessionReady && authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router, sessionReady]);

  const ready = authStatus === "authenticated" && !groupsLoading;

  return {
    ready,
    loading: authStatus !== "authenticated" || groupsLoading,
    user,
    canAccessAdmin,
  };
};
