"use client";

import {
  getEnabledSocialProviders,
  isSocialAuthEnabled,
  type SocialAuthProvider,
} from "@/config/socialAuth";
import { signInWithSocialProvider } from "@/lib/auth/socialSignIn";
import { useState } from "react";

interface SocialAuthButtonsProps {
  mode: "signIn" | "signUp";
  returnTo?: string | null;
}

const PROVIDER_LABELS: Record<SocialAuthProvider, string> = {
  Google: "Google",
  Facebook: "Facebook",
  Apple: "Apple",
};

const ProviderIcon = ({ provider }: { provider: SocialAuthProvider }) => {
  if (provider === "Google") {
    return (
      <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }

  if (provider === "Facebook") {
    return (
      <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="h-5 w-5 text-nurture-charcoal" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.788.96-2.04 1.713-3.164 1.615-.12-1.08.507-2.234 1.165-3.033C13.98 2.32 15.35 1.67 16.365 1.43zM20.72 17.226c-.77 1.778-1.708 3.537-3.077 3.537-1.16 0-1.46-.74-2.87-.74-1.45 0-1.76.76-2.86.76-1.39 0-2.44-2.27-3.21-4.05-1.73-4.18-1.92-9.07-.84-11.67.77-2.05 2.11-3.35 3.66-3.35 1.14 0 2.19.76 2.87.76.66 0 1.92-.89 3.24-.76.55.02 2.1.22 3.1 1.66-2.7 1.64-2.26 5.9.52 7.05-.5 1.2-1.05 2.36-1.72 3.53z" />
    </svg>
  );
};

export function SocialAuthButtons({ mode, returnTo }: SocialAuthButtonsProps) {
  const providers = getEnabledSocialProviders();
  const [pending, setPending] = useState<SocialAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSocialAuthEnabled() || providers.length === 0) {
    return null;
  }

  const handleClick = async (provider: SocialAuthProvider) => {
    setError(null);
    setPending(provider);
    try {
      await signInWithSocialProvider(provider, returnTo);
    } catch (err) {
      console.error("[auth] social sign-in failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not start social sign-in. Try again or use email."
      );
      setPending(null);
    }
  };

  const actionLabel = mode === "signUp" ? "Sign up" : "Continue";

  return (
    <div className="mb-6">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-nurture-charcoal/50">
        {mode === "signUp" ? "Or create an account with" : "Or continue with"}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={pending !== null}
            onClick={() => handleClick(provider)}
            className="flex items-center justify-center gap-2 rounded-xl border border-nurture-sage/20 bg-white px-3 py-2.5 text-sm font-medium text-nurture-charcoal transition hover:border-nurture-sage/40 hover:bg-nurture-cream/50 disabled:opacity-60"
          >
            <ProviderIcon provider={provider} />
            <span>
              {pending === provider ? "Redirecting…" : `${actionLabel} ${PROVIDER_LABELS[provider]}`}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-3 text-center text-sm text-red-700/90" role="alert">
          {error}
        </p>
      ) : null}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-nurture-sage/15" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-white px-3 text-nurture-charcoal/45">or use email</span>
        </div>
      </div>
    </div>
  );
}
