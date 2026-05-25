"use client";

import GoogleReviews from "@/components/Reviews/GoogleReviews";
import {
  googleReviewsVisibility,
  isGoogleReviewsEnabled,
} from "@/config/googleReviews";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useAuthenticator } from "@aws-amplify/ui-react";

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
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const isAuthenticated = authStatus === "authenticated";
  const { canAccessAdmin, loading } = useUserGroups(isAuthenticated);

  if (!isGoogleReviewsEnabled()) return null;

  if (googleReviewsVisibility === "admin") {
    if (!isAuthenticated || loading || !canAccessAdmin) return null;
  }

  return <GoogleReviews className={className} />;
};

export default GoogleReviewsSection;
