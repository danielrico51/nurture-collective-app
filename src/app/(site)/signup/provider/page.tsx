"use client";

import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { brands } from "@/content/site";
import Link from "next/link";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

const ProviderSignupInfoPage = () => {
  if (PUBLIC_SIGNUP_ENABLED) {
    // When signup is enabled, redirect to main signup with provider context
    // For now reuse contact flow as primary provider onboarding
  }

  return (
    <AuthPageShell
      eyebrow="For providers"
      title="Join our provider network"
      subtitle={`Apply to join the ${brands.nurtureCollective.name} provider network — doulas, lactation consultants, newborn care specialists, and more.`}
      highlights={[
        "Partner with a trusted NJ practice",
        "Shape our AI-powered marketplace",
        "Get matched with families who need you",
      ]}
      footer={
        <p className="mt-6 border-t border-nurture-sage/10 pt-6 text-center text-sm text-nurture-charcoal/65">
          Already onboarded?{" "}
          <Link
            href="/signin"
            className="font-semibold text-nurture-sage-dark hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-nurture-charcoal/70">
          Provider accounts are reviewed by our team. Submit your application
          and we&apos;ll schedule a conversation about credentials, fit, and
          onboarding.
        </p>
        <Link
          href="/contact?audience=provider"
          className="inline-block rounded-full bg-nurture-sage px-8 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
        >
          Apply to join
        </Link>
        <p className="text-xs text-nurture-charcoal/50">
          <Link href="/for-providers" className="text-nurture-sage-dark hover:underline">
            Learn more about joining
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
};

export default ProviderSignupInfoPage;
