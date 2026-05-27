import {
  buildGuestAccountSigninHref,
  buildGuestAccountSignupHref,
  PUBLIC_INTAKE_PATH,
} from "@/config/intakeAccess";
import { canCreateMemberAccount } from "@/config/publicAccess";
import Link from "next/link";

interface GuestSaveProgressPromptProps {
  variant?: "banner" | "card" | "compact";
  returnTo?: string;
  className?: string;
}

const GuestSaveProgressPrompt = ({
  variant = "card",
  returnTo = PUBLIC_INTAKE_PATH,
  className = "",
}: GuestSaveProgressPromptProps) => {
  const signupHref = buildGuestAccountSignupHref(returnTo);
  const signinHref = buildGuestAccountSigninHref(returnTo);
  const signupEnabled = canCreateMemberAccount();

  if (variant === "banner") {
    return (
      <div
        className={`border-b border-nurture-sage/15 bg-nurture-sage/5 px-4 py-2.5 text-center text-xs leading-relaxed text-nurture-charcoal/80 ${className}`}
      >
        <span>
          Chatting as a guest — progress is saved in this browser session only.{" "}
        </span>
        {signupEnabled ? (
          <Link
            href={signupHref}
            className="font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
          >
            Create a free account
          </Link>
        ) : (
          <span className="font-semibold text-nurture-sage-dark">
            Create a free account
          </span>
        )}
        <span> to keep your conversation and continue anytime.</span>
        {" "}
        <Link
          href={signinHref}
          className="font-medium text-nurture-charcoal/70 underline-offset-2 hover:text-nurture-charcoal hover:underline"
        >
          Sign in
        </Link>
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
            <Link
              href={signupHref}
              className="font-semibold text-nurture-sage-dark underline-offset-2 hover:underline"
            >
              Create a free account
            </Link>
            {" to save your progress · "}
          </>
        ) : (
          <>Save your progress with a free account · </>
        )}
        <Link
          href={signinHref}
          className="font-medium text-nurture-charcoal/70 underline-offset-2 hover:text-nurture-charcoal hover:underline"
        >
          Sign in
        </Link>
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
          <Link
            href={signupHref}
            className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
          >
            Create free account
          </Link>
        ) : null}
        <Link
          href={signinHref}
          className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default GuestSaveProgressPrompt;
