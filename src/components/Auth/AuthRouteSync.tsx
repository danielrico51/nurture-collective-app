"use client";

import {
  isAmplifySignInRoute,
  isAmplifySignUpRoute,
  isAuthSignInPath,
  isAuthSignUpPath,
} from "@/components/Auth/authRoutes";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/**
 * Aligns Amplify Authenticator.Provider tab state with the URL.
 * Only transitions when the current route does not already match.
 */
export function AuthRouteSync() {
  const pathname = usePathname();
  const { route, toSignUp, toSignIn } = useAuthenticator((context) => [
    context.route,
    context.toSignUp,
    context.toSignIn,
  ]);

  useLayoutEffect(() => {
    if (!pathname) return;

    if (isAuthSignUpPath(pathname)) {
      if (!isAmplifySignUpRoute(route)) {
        toSignUp();
      }
      return;
    }

    if (isAuthSignInPath(pathname) && !isAmplifySignInRoute(route)) {
      toSignIn();
    }
  }, [pathname, route, toSignUp, toSignIn]);

  return null;
}
