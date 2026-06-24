"use client";

import AnalyticsProvider from "@/components/Analytics/AnalyticsProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SiteArtworkBackground from "@/components/Common/SiteArtworkBackground";
import { isIntakeChatPath } from "@/config/intakeAccess";
import { shouldShowSiteArtwork } from "@/config/siteArtwork";
import { configureAmplify } from "@/utils/amplifyConfig";
import "@aws-amplify/ui-react/styles.css";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser } from "aws-amplify/auth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isIntakeChat = isIntakeChatPath(pathname);
  const isOAuthCallback = pathname === "/oauth/callback";
  const isInvoicePrint = pathname.startsWith("/invoice/");
  const showSiteArtwork = shouldShowSiteArtwork(pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configureAmplify();

    if (isOAuthCallback) {
      setReady(true);
      return;
    }

    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setReady(true);
      }
    };

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        setIsAuthenticated(true);
      }
      if (payload.event === "signedOut") {
        setIsAuthenticated(false);
      }
    });

    checkAuth();

    return () => unsubscribe();
  }, [isOAuthCallback]);

  useEffect(() => {
    if (!isIntakeChat) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isIntakeChat]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading…</p>
      </div>
    );
  }

  if (isInvoicePrint) {
    return <>{children}</>;
  }

  return (
    <>
      <AnalyticsProvider />
      <Toaster position="top-center" />
      <Header isAuthenticated={isAuthenticated} />
      <main
        className={
          isIntakeChat
            ? "fixed inset-x-0 bottom-0 top-28 overflow-hidden sm:top-32 md:top-36"
            : "min-h-screen"
        }
      >
        {showSiteArtwork ? (
          <SiteArtworkBackground
            intensity={
              pathname === "/" || pathname === "/services" ? "light" : "subtle"
            }
          >
            {children}
          </SiteArtworkBackground>
        ) : (
          children
        )}
      </main>
      {isIntakeChat ? null : <Footer />}
    </>
  );
}
