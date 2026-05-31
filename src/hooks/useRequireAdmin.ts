"use client";

import { useSessionAuth } from "@/hooks/useSessionAuth";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAdmin = () => {
  const router = useRouter();
  const { authStatus, user, ready: sessionReady } = useSessionAuth();
  const {
    groups,
    canAccessAdmin,
    loading: groupsLoading,
    refreshing,
    refreshGroups,
  } = useUserGroups(authStatus === "authenticated");

  useEffect(() => {
    if (sessionReady && authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router, sessionReady]);

  const ready =
    authStatus === "authenticated" && !groupsLoading && canAccessAdmin;

  const denied =
    authStatus === "authenticated" && !groupsLoading && !canAccessAdmin;

  return {
    ready,
    denied,
    loading: authStatus !== "authenticated" || groupsLoading,
    user,
    canAccessAdmin,
    groups,
    refreshGroups,
    refreshing,
  };
};
