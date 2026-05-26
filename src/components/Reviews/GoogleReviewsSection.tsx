"use client";

import GoogleReviews from "@/components/Reviews/GoogleReviews";
import {
  googleReviewsVisibility,
  isGoogleReviewsEnabled,
} from "@/config/googleReviews";
import { useUserGroups } from "@/hooks/useUserGroups";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useEffect, useState } from "react";

interface GoogleReviewsSectionProps {
  className?: string;
}

/**
 * Renders Google reviews when enabled via env.
 * - visibility=admin: signed-in admin users only (team preview)
 * - visibility=public: everyone
 * - visibility=off: hidden
 *
 * Uses getCurrentUser (same as the site header) — not useAuthenticator, which
 * does not reliably reflect existing Cognito sessions on marketing pages.
 */
const GoogleReviewsSection = ({ className }: GoogleReviewsSectionProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const { canAccessAdmin, loading: groupsLoading } =
    useUserGroups(isAuthenticated);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthReady(true);
      }
    };

    syncAuth();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        setIsAuthenticated(true);
        setAuthReady(true);
      }
      if (payload.event === "signedOut") {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isGoogleReviewsEnabled()) return null;

  if (googleReviewsVisibility === "admin") {
    if (!authReady || groupsLoading) return null;
    if (!isAuthenticated || !canAccessAdmin) return null;
  }

  return <GoogleReviews className={className} />;
};

export default GoogleReviewsSection;
