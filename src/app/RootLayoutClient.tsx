"use client";

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
  const showSiteArtwork = shouldShowSiteArtwork(pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configureAmplify();

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
  }, []);

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

  return (
    <>
      <Toaster position="top-center" />
      <Header isAuthenticated={isAuthenticated} />
      <main
        className={
          isIntakeChat
            ? "fixed inset-x-0 bottom-0 top-20 overflow-hidden"
            : "min-h-screen pt-20"
        }
      >
        {showSiteArtwork ? (
          <SiteArtworkBackground
            intensity={pathname === "/services" ? "medium" : "subtle"}
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
