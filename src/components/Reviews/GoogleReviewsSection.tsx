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
    if (!ready || groupsLoading) return null;
    if (!isAuthenticated || !canAccessAdmin) return null;
  }

  return <GoogleReviews className={className} />;
};

export default GoogleReviewsSection;
