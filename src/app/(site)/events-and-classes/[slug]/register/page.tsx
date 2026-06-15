import Breadcrumb from "@/components/Common/Breadcrumb";
import ClassRegistrationForm from "@/components/Events/ClassRegistrationForm";
import ClassRegistrationReturnHandler from "@/components/Events/ClassRegistrationReturnHandler";
import ClassRegistrationSourceTracker from "@/components/Events/ClassRegistrationSourceTracker";
import {
  formatEventDate,
  formatEventPrice,
  formatEventSchedule,
  kindLabel,
} from "@/lib/events/format";
import {
  getClassAvailabilityForEvent,
  isOnlineRegistrationEnabled,
} from "@/lib/classRegistrations/service";
import { buildPageMetadata } from "@/config/seo";
import { fetchPublishedEvent } from "@/lib/events/public";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface RegisterPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const item = await fetchPublishedEvent(params.slug);
  if (!item) {
    return buildPageMetadata({
      title: "Register",
      description: "Class registration",
      path: "/events-and-classes",
    });
  }
  return buildPageMetadata({
    title: `Register · ${item.title}`,
    description: `Register online for ${item.title}.`,
    path: `/events-and-classes/${item.slug}/register`,
  });
}

export default async function EventRegisterPage({ params }: RegisterPageProps) {
  const item = await fetchPublishedEvent(params.slug);
  if (!item) notFound();

  if (!isOnlineRegistrationEnabled(item)) {
    redirect(`/events-and-classes/${item.slug}`);
  }

  const availability = await getClassAvailabilityForEvent(item);
  const priceLabel = formatEventPrice(item.priceCents);

  return (
    <>
      <Breadcrumb pageName="Register" />
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`/events-and-classes/${item.slug}`}
            className="text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            ← Back to class details
          </Link>

          <header className="mt-6 border-b border-nurture-sage/15 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
              {kindLabel(item.kind)}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-nurture-charcoal">
              {item.title}
            </h1>
            <p className="mt-2 text-sm text-nurture-charcoal/70">
              {formatEventSchedule(item.eventDate, item.startTime)}
              {item.location ? ` · ${item.location}` : ""}
              {priceLabel ? ` · ${priceLabel}` : ""}
            </p>
            <p className="mt-2 text-sm text-nurture-charcoal/60">
              {formatEventDate(item.eventDate)}
            </p>
          </header>

          <div className="mt-8">
            <Suspense fallback={null}>
              <ClassRegistrationSourceTracker />
              <ClassRegistrationReturnHandler eventSlug={item.slug} />
            </Suspense>
            <ClassRegistrationForm event={item} availability={availability} />
          </div>
        </div>
      </section>
    </>
  );
}
