"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { configureAmplify } from "@/utils/amplifyConfig";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <html lang="en">
      <body className="font-sans">
        {!ready ? (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-nurture-charcoal/60">Loading…</p>
          </div>
        ) : (
          <Authenticator.Provider>
            <Toaster position="top-center" />
            <Header isAuthenticated={isAuthenticated} />
            <main className="min-h-screen pt-20">{children}</main>
            <Footer />
          </Authenticator.Provider>
        )}
      </body>
    </html>
  );
}
