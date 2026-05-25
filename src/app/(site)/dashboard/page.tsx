"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { buildWhatsAppUrl, hasCalendly, hasWhatsApp } from "@/config/integrations";
import { brands } from "@/content/site";
import { useUserGroups } from "@/hooks/useUserGroups";
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
  const { canAccessAdmin } = useUserGroups(authStatus === "authenticated");

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

  const whatsappUrl = buildWhatsAppUrl(
    "Hi! I'm a Nurture Collective member and would like to connect about care."
  );

  const cards = [
    {
      title: "Intake form",
      description:
        "Tell us about your needs, due date, and the support you're looking for.",
      status: "Available",
      href: "/dashboard/intake",
      action: "Start intake",
    },
    {
      title: "Care plan",
      description: "Your personalized support plan from your concierge coordinator.",
      status: "In preparation",
      href: null,
      action: null,
    },
    {
      title: "Messages",
      description: "Connect with your care team via WhatsApp.",
      status: hasWhatsApp() ? "Available" : "Coming soon",
      href: whatsappUrl,
      action: hasWhatsApp() ? "Open WhatsApp" : null,
      external: true,
    },
  ];

  return (
    <>
      <Breadcrumb pageName="Your dashboard" />
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8 shadow-sm md:p-12">
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Hello, {displayName}
          </h2>
          <p className="mt-3 max-w-2xl text-nurture-charcoal/80">
            Welcome to {brands.nurtureCollective.name}. Complete your intake,
            view your care plan, and stay connected with your care team.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {cards.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-xl border border-nurture-blush/40 bg-nurture-cream/50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
                  {item.status}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-nurture-charcoal/70">
                  {item.description}
                </p>
                {item.href && item.action ? (
                  item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                    >
                      {item.action} →
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                    >
                      {item.action} →
                    </Link>
                  )
                ) : item.title === "Care plan" ? (
                  <p className="mt-4 text-xs text-nurture-charcoal/50">
                    Your coordinator will share your plan after intake.
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {hasCalendly() ? (
            <div className="mt-10 rounded-xl border border-nurture-sage/15 bg-nurture-sage/5 p-6">
              <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                Schedule a check-in
              </h3>
              <p className="mt-2 text-sm text-nurture-charcoal/70">
                Book time with your care team when you&apos;re ready.
              </p>
              <Link
                href="/services#calendly"
                className="mt-4 inline-block rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-medium text-white hover:bg-nurture-sage-dark"
              >
                View scheduling options
              </Link>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/account/profile"
              className="rounded-full bg-nurture-sage px-6 py-3 text-sm font-medium text-white hover:bg-nurture-sage-dark"
            >
              Edit profile
            </Link>
            {canAccessAdmin ? (
              <Link
                href="/admin"
                className="rounded-full border border-nurture-sage px-6 py-3 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                Admin apps
              </Link>
            ) : null}
            <Link
              href="/for-moms#coverage"
              className="rounded-full px-6 py-3 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
            >
              Check coverage
            </Link>
            <Link
              href="/contact?audience=mom"
              className="rounded-full px-6 py-3 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
            >
              Contact care team
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
