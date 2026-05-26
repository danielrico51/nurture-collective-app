"use client";

import GoogleReviews from "@/components/Reviews/GoogleReviews";
import {
  googleReviewsVisibility,
  isGoogleReviewsEnabled,
} from "@/config/googleReviews";
import { useSessionAuth } from "@/hooks/useSessionAuth";
import { useUserGroups } from "@/hooks/useUserGroups";

interface GoogleReviewsSectionProps {
  className?: string;
}

/**
 * Renders Google reviews when enabled via env.
 * - visibility=admin: signed-in admin users only (team preview)
 * - visibility=public: everyone
 * - visibility=off: hidden
 */
const GoogleReviewsSection = ({ className }: GoogleReviewsSectionProps) => {
  const { isAuthenticated, ready } = useSessionAuth();
  const { canAccessAdmin, loading: groupsLoading } =
    useUserGroups(isAuthenticated);

  if (!isGoogleReviewsEnabled()) return null;

  if (googleReviewsVisibility === "admin") {
    if (!ready || groupsLoading) {
      return (
        <section className={`py-16 ${className ?? ""}`}>
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-nurture-charcoal/60">
              Loading reviews…
            </p>
          </div>
        </section>
      );
    }
    if (!isAuthenticated || !canAccessAdmin) return null;
  }

  return <GoogleReviews className={className} />;
};

export default GoogleReviewsSection;
