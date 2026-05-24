"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DashboardPage = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading your dashboard…</p>
      </div>
    );
  }

  const displayName =
    user?.signInDetails?.loginId?.split("@")[0] ?? "there";

  return (
    <>
      <Breadcrumb pageName="Your dashboard" />
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8 shadow-sm md:p-12">
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Hello, {displayName}
          </h2>
          <p className="mt-3 max-w-2xl text-nurture-charcoal/80">
            Your care journey starts here. Soon you&apos;ll be able to complete
            your intake, view your care plan, and message your concierge team —
            all in one place.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Intake form",
                description: "Tell us about your needs and preferences.",
                status: "Coming soon",
              },
              {
                title: "Care plan",
                description: "Your personalized pre- or postpartum support.",
                status: "Coming soon",
              },
              {
                title: "Messages",
                description: "Connect with your concierge coordinator.",
                status: "Coming soon",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-nurture-blush/40 bg-nurture-cream/50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
                  {item.status}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-nurture-charcoal/70">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/management/tasks"
              className="rounded-full bg-nurture-sage px-6 py-3 text-sm font-medium text-white hover:bg-nurture-sage-dark"
            >
              Team task board
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-nurture-sage px-6 py-3 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Explore services
            </Link>
            <Link
              href="/contact"
              className="rounded-full px-6 py-3 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
