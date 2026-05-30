"use client";

import { useUserGroups } from "@/hooks/useUserGroups";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Requires a signed-in member (any authenticated user, including admins). */
export const useRequireMember = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const { canAccessAdmin, loading: groupsLoading } = useUserGroups(
    authStatus === "authenticated"
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router]);

  const ready = authStatus === "authenticated" && !groupsLoading;

  return {
    ready,
    loading: authStatus !== "authenticated" || groupsLoading,
    user,
    canAccessAdmin,
  };
};
