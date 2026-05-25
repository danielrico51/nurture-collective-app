"use client";

import SignupPage from "@/app/(site)/(auth)/signup/page";
import { brands } from "@/content/site";
import Link from "next/link";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

/** Mom-focused signup entry — reuses shared signup when enabled. */
const MomSignupPage = () => {
  if (!PUBLIC_SIGNUP_ENABLED) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-nurture-charcoal">
          Member signup coming soon
        </h1>
        <p className="mt-4 text-nurture-charcoal/70">
          Request care through {brands.nurtureCollective.shortName} while we
          open member accounts.
        </p>
        <Link
          href="/contact?audience=mom"
          className="mt-8 inline-block rounded-full bg-nurture-sage px-8 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
        >
          Request care
        </Link>
      </div>
    );
  }

  return <SignupPage />;
};

export default MomSignupPage;
