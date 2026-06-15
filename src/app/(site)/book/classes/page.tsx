import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import {
  appendRegistrationSourceToPath,
  GOOGLE_BUSINESS_REGISTRATION_SOURCE,
} from "@/lib/classRegistrations/attribution";
import {
  buildBookableClassCta,
  formatBookableSpotsLabel,
  listBookableClasses,
} from "@/lib/classRegistrations/bookableClasses";
import {
  formatEventDate,
  formatEventPrice,
  formatEventSchedule,
  formatLabel,
} from "@/lib/events/format";
import { brands } from "@/content/site";
import { buildPageMetadata } from "@/config/seo";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Book a Childbirth Class",
  description:
    "Reserve an upcoming childbirth education or prenatal class with The Nesting Place in Northern New Jersey and the tri-state area.",
  path: "/book/classes",
  keywords: [
    "book childbirth class New Jersey",
    "prenatal class registration",
    "Google Business booking classes",
  ],
});

const withGoogleBusinessSource = (path: string) =>
  appendRegistrationSourceToPath(path, GOOGLE_BUSINESS_REGISTRATION_SOURCE);

export default async function BookClassesPage() {
  const listings = await listBookableClasses();

  return (
    <>
      <Breadcrumb pageName="Book a class" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Book an upcoming class"
            subtitle={`Reserve childbirth education and prenatal classes with ${brands.nestingPlace.name}. Choose an open session below to register online.`}
            centered
          />

          {listings.length === 0 ? (
            <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-nurture-sage/15 bg-white p-8 text-center shadow-sm">
              <p className="text-nurture-charcoal/75">
                New sessions are being scheduled. Browse our full catalog or contact
                us and we&apos;ll help you find the right class.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/events-and-classes"
                  className="rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
                >
                  View all events & classes
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-nurture-sage/30 px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
                >
                  Contact us
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-12 grid gap-8 md:grid-cols-2">
              {listings.map((listing) => {
                const { event, availability } = listing;
                const cta = buildBookableClassCta(listing);
                const priceLabel = formatEventPrice(event.priceCents);
                const registerHref = withGoogleBusinessSource(cta.href);
                const detailsHref = withGoogleBusinessSource(
                  `/events-and-classes/${event.slug}`
                );

                return (
                  <li key={event.slug}>
                    <article className="flex h-full flex-col rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm">
                      <time
                        dateTime={event.eventDate}
                        className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark"
                      >
                        {formatEventDate(event.eventDate)}
                      </time>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-nurture-charcoal">
                        {event.title}
                      </h2>
                      <p className="mt-2 text-sm text-nurture-charcoal/70">
                        {formatEventSchedule(event.eventDate, event.startTime)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-nurture-charcoal/65">
                        {formatLabel(event.format)}
                        {priceLabel ? ` · ${priceLabel}` : ""}
                      </p>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-nurture-charcoal/75">
                        {event.excerpt}
                      </p>
                      <p className="mt-4 text-sm font-medium text-nurture-sage-dark">
                        {formatBookableSpotsLabel(availability)}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                          href={registerHref}
                          className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
                        >
                          {cta.label}
                        </Link>
                        <Link
                          href={detailsHref}
                          className="text-sm font-semibold text-nurture-sage-dark hover:underline"
                        >
                          Class details →
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-14 text-center">
            <Link
              href="/events-and-classes"
              className="text-sm font-semibold text-nurture-sage-dark hover:underline"
            >
              Browse all events & classes →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
