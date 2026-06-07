"use client";

import {
  buildGuestAccountSigninHref,
  buildGuestAccountSignupHref,
  INTAKE_SESSION_STORAGE_KEY,
  PUBLIC_INTAKE_PATH,
} from "@/config/intakeAccess";
import { canCreateMemberAccount } from "@/config/publicAccess";
import { storeAuthReturnTo } from "@/config/socialAuth";

interface GuestSaveProgressPromptProps {
  variant?: "banner" | "card" | "compact";
  returnTo?: string;
  className?: string;
  /** Show a control to discard the cached guest chat and reload. */
  showStartFresh?: boolean;
}

const linkClass =
  "font-semibold text-nurture-sage-dark underline underline-offset-2 hover:text-nurture-charcoal";

const secondaryLinkClass =
  "font-medium text-nurture-charcoal/80 underline underline-offset-2 hover:text-nurture-charcoal";

const GuestSaveProgressPrompt = ({
  variant = "card",
  returnTo = PUBLIC_INTAKE_PATH,
  className = "",
  showStartFresh = false,
}: GuestSaveProgressPromptProps) => {
  const signupHref = buildGuestAccountSignupHref(returnTo);
  const signinHref = buildGuestAccountSigninHref(returnTo);
  const signupEnabled = canCreateMemberAccount();

  const rememberReturnTo = () => {
    storeAuthReturnTo(returnTo);
  };

  const startFreshConversation = () => {
    sessionStorage.removeItem(INTAKE_SESSION_STORAGE_KEY);
    window.location.assign(returnTo);
  };

  if (variant === "banner") {
    return (
      <div
        className={`relative z-20 border-b border-nurture-sage/15 bg-nurture-sage/5 px-4 py-2.5 text-center text-xs leading-relaxed text-nurture-charcoal/80 ${className}`}
      >
        <p>
          Chatting as a guest — progress is saved in this browser session only.{" "}
          {signupEnabled ? (
            <a href={signupHref} onClick={rememberReturnTo} className={linkClass}>
              Create a free account
            </a>
          ) : (
            <span className="font-semibold text-nurture-sage-dark">
              Create a free account
            </span>
          )}
          <span> to keep your conversation and continue anytime.</span>{" "}
          <a href={signinHref} onClick={rememberReturnTo} className={secondaryLinkClass}>
            Sign in
          </a>
        </p>
        {showStartFresh ? (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={startFreshConversation}
              className="rounded-full border border-nurture-sage/30 bg-white/90 px-3 py-1 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Start a new conversation
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <p
        className={`text-center text-xs leading-relaxed text-nurture-charcoal/60 ${className}`}
      >
        {signupEnabled ? (
          <>
            <a href={signupHref} onClick={rememberReturnTo} className={linkClass}>
              Create a free account
            </a>
            {" to save your progress · "}
          </>
        ) : (
          <>Save your progress with a free account · </>
        )}
        <a href={signinHref} onClick={rememberReturnTo} className={secondaryLinkClass}>
          Sign in
        </a>
        {showStartFresh ? (
          <>
            {" · "}
            <button
              type="button"
              onClick={startFreshConversation}
              className="font-medium text-nurture-sage-dark underline underline-offset-2 hover:text-nurture-charcoal"
            >
              Start a new conversation
            </button>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-nurture-sage/20 bg-white/90 px-4 py-3 text-center ${className}`}
    >
      <p className="text-sm font-medium text-nurture-charcoal">
        Save your progress with a free account
      </p>
      <p className="mt-1 text-xs leading-relaxed text-nurture-charcoal/65">
        You can keep chatting now. Create an account anytime so your care profile
        and conversation aren&apos;t lost — pick up right where you left off.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {signupEnabled ? (
          <a
            href={signupHref}
            onClick={rememberReturnTo}
            className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
          >
            Create free account
          </a>
        ) : null}
        <a
          href={signinHref}
          onClick={rememberReturnTo}
          className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Sign in
        </a>
        {showStartFresh ? (
          <button
            type="button"
            onClick={startFreshConversation}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-medium text-nurture-charcoal/70 hover:bg-nurture-sage/10"
          >
            Start a new conversation
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default GuestSaveProgressPrompt;
