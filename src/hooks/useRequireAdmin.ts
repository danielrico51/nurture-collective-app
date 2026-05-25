"use client";

import { useUserGroups } from "@/hooks/useUserGroups";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAdmin = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const {
    groups,
    canAccessAdmin,
    loading: groupsLoading,
    refreshing,
    refreshGroups,
  } = useUserGroups(authStatus === "authenticated");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router]);

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
