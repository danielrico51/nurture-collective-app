"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import type { ReactNode } from "react";
import type { EmailAuthMode } from "@/components/Auth/EmailAuthAuthenticator";

/**
 * Fresh Authenticator UI state per sign-in vs sign-up page.
 * The root layout Provider keeps auth session for the header; this inner
 * Provider only owns the form route (signIn / signUp) for that page.
 */
export function AuthFormProvider({
  mode,
  children,
}: {
  mode: EmailAuthMode;
  children: ReactNode;
}) {
  return (
    <Authenticator.Provider key={`nurture-auth-form-${mode}`}>
      {children}
    </Authenticator.Provider>
  );
}
