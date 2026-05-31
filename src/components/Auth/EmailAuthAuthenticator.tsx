"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import type { AuthenticatorProps } from "@aws-amplify/ui-react";

export type EmailAuthMode = "signIn" | "signUp";

type EmailAuthAuthenticatorProps = {
  mode: EmailAuthMode;
  className?: string;
} & Omit<AuthenticatorProps, "initialState" | "hideSignUp">;

export function EmailAuthAuthenticator({
  mode,
  className = "",
  ...authenticatorProps
}: EmailAuthAuthenticatorProps) {
  return (
    <div
      className={
        mode === "signUp"
          ? `nurture-authenticator--signup-only ${className}`.trim()
          : className
      }
    >
      <Authenticator
        initialState={mode === "signUp" ? "signUp" : "signIn"}
        hideSignUp={mode === "signIn"}
        {...authenticatorProps}
      />
    </div>
  );
}
