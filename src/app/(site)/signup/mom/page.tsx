"use client";

import SignupPage from "@/app/(site)/(auth)/signup/page";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";
import Link from "next/link";
import { canCreateMemberAccount } from "@/config/publicAccess";

/** Mom-focused signup entry — reuses shared signup when enabled. */
const MomSignupPage = () => {
  if (!canCreateMemberAccount()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-nurture-charcoal">
          Member signup coming soon
        </h1>
        <p className="mt-4 text-nurture-charcoal/70">
          Request support through {brands.nestingPlace.name} while we
          open member accounts.
        </p>
        <Link
          href={buildCareStartHref()}
          className="btn-primary-lg mt-8"
        >
          Request support
        </Link>
      </div>
    );
  }

  return <SignupPage />;
};

export default MomSignupPage;
