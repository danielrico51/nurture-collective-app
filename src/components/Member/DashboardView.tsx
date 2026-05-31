"use client";

import CareChecklist from "@/components/Dashboard/CareChecklist";
import CareRecommendations from "@/components/Dashboard/CareRecommendations";
import {
  buildBookingPageHref,
  buildBookingUrlWithPrefill,
  getBookingProviderLabel,
  hasBooking,
} from "@/config/bookings";
import { buildIntakeHref } from "@/config/carePaths";
import { buildWhatsAppUrl, hasWhatsApp } from "@/config/integrations";
import { MEMBER_APPS_HREF } from "@/config/memberApps";
import { brands, momFaqs } from "@/content/site";
import { MATERNAL_STAGE_LABELS } from "@/content/intake";
import { useMemberIntake } from "@/hooks/useMemberIntake";
import { useRequireMember } from "@/hooks/useRequireMember";
import { buildCareChecklist } from "@/lib/intake/recommendations";
import type { MaternalStage } from "@/types/intake";
import { isIntakeComplete } from "@/types/intake";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const MEMBER_INTAKE_PATH = "/apps/dashboard/intake";

export function DashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, user, canAccessAdmin } = useRequireMember();
  const { intake, loading: loadingIntake, reload: reloadIntake } =
    useMemberIntake(ready);

  const needsIntake =
    ready &&
    !loadingIntake &&
    !canAccessAdmin &&
    !isIntakeComplete(intake?.profile?.intakeStatus);

  const headingToIntake =
    needsIntake && pathname !== MEMBER_INTAKE_PATH;

  useEffect(() => {
    if (headingToIntake) {
      router.replace(MEMBER_INTAKE_PATH);
    }
  }, [headingToIntake, router]);

  if (!ready || loadingIntake || headingToIntake) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">
          {headingToIntake
            ? "Continuing your support journey…"
            : "Loading your dashboard…"}
        </p>
      </div>
    );
  }

  const displayName =
    intake?.profile?.name?.split(" ")[0] ||
    user?.loginId?.split("@")[0] ||
    "there";

  const intakeComplete = isIntakeComplete(intake?.profile?.intakeStatus);
  const intakeInReview = intake?.profile?.intakeStatus === "in-review";
  const checklist = buildCareChecklist(
    intake?.profile ?? null,
    (intake?.recommendations.length ?? 0) > 0
  );

  const whatsappUrl = buildWhatsAppUrl(
    "Hi! I'm a Nesting Place member and would like to connect about support."
  );

  const bookingUrl = buildBookingUrlWithPrefill({
    name: intake?.profile?.name,
    email: intake?.profile?.email,
  });
  const bookingLabel = getBookingProviderLabel();

  const stageLabel = intake?.profile?.maternalStage
    ? MATERNAL_STAGE_LABELS[intake.profile.maternalStage as MaternalStage]
    : null;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-nurture-sage-dark">
            {intakeInReview
              ? "Under review"
              : intakeComplete
                ? "Your support journey"
                : "Welcome"}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
            Hello, {displayName}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-nurture-charcoal/75 sm:text-base">
            {intakeInReview
              ? "Your intake is with your coordinator — they'll reach out soon with next steps."
              : intakeComplete
                ? stageLabel
                  ? `You're in the ${stageLabel.toLowerCase()} stage. Your coordinator is preparing personalized support.`
                  : "Your intake is complete. Explore your recommendations and next steps below."
                : `Welcome to ${brands.nestingPlace.name}. Start your support journey to receive personalized recommendations.`}
          </p>
        </div>
        {!intakeComplete ? (
          <Link
            href={buildIntakeHref()}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-nurture-sage px-8 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            Start Your Support Journey
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => reloadIntake()}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-nurture-sage/30 px-5 py-2.5 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Refresh status
          </button>
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <CareRecommendations recommendations={intake?.recommendations ?? []} />
        <CareChecklist items={checklist} />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-nurture-blush/40 bg-nurture-cream/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            {hasBooking() ? "Available" : "Coming soon"}
          </p>
          <h3 className="mt-2 font-serif text-lg font-semibold">
            Upcoming appointments
          </h3>
          <p className="mt-2 text-sm text-nurture-charcoal/70">
            {hasBooking()
              ? `Schedule your intro call or next check-in via ${bookingLabel}.`
              : "Appointment scheduling will appear here once your coordinator sets up your first visit."}
          </p>
          {hasBooking() && bookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
            >
              Schedule now →
            </a>
          ) : null}
          {hasBooking() ? (
            <Link
              href={buildBookingPageHref("/services")}
              className="mt-2 block text-xs text-nurture-charcoal/55 hover:underline"
            >
              Or book on our services page
            </Link>
          ) : null}
        </div>

        <div className="rounded-2xl border border-nurture-blush/40 bg-nurture-cream/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            {hasWhatsApp() ? "Available" : "Coming soon"}
          </p>
          <h3 className="mt-2 font-serif text-lg font-semibold">
            Connect with your team
          </h3>
          <p className="mt-2 text-sm text-nurture-charcoal/70">
            Message your support coordinator for questions between visits.
          </p>
          {hasWhatsApp() && whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
            >
              Open WhatsApp →
            </a>
          ) : null}
        </div>

        <div className="rounded-2xl border border-nurture-blush/40 bg-nurture-cream/50 p-6 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            Resources
          </p>
          <h3 className="mt-2 font-serif text-lg font-semibold">
            Support & guidance
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-nurture-charcoal/70">
            {momFaqs.slice(0, 2).map((faq) => (
              <li key={faq.q}>
                <Link
                  href="/for-moms#faq"
                  className="hover:text-nurture-sage-dark hover:underline"
                >
                  {faq.q}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/for-moms"
            className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            Explore resources →
          </Link>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-nurture-sage/10 pt-8">
        <Link
          href="/account/profile"
          className="rounded-full border border-nurture-sage px-5 py-2.5 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Edit profile
        </Link>
        {intakeComplete ? (
          <Link
            href={buildIntakeHref()}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
          >
            View intake
          </Link>
        ) : null}
        <Link
          href={MEMBER_APPS_HREF}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
        >
          All apps
        </Link>
        {canAccessAdmin ? (
          <Link
            href="/admin"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
          >
            Admin workspace
          </Link>
        ) : null}
        <Link
          href="/contact?audience=mom"
          className="rounded-full px-5 py-2.5 text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark"
        >
          Contact support team
        </Link>
      </div>
    </div>
  );
}
