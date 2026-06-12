import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import JsonLd from "@/components/Seo/JsonLd";
import {
  formatEventDate,
  formatLabel,
  kindLabel,
  listingStatusBadgeClass,
  LISTING_STATUS_LABELS,
} from "@/lib/events/format";
import { fetchPublishedEvents } from "@/lib/events/public";
import { classRefundPolicy } from "@/content/events";
import { brands } from "@/content/site";
import { buildPageMetadata } from "@/config/seo";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonLd";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Events & Childbirth Classes in NJ & NY",
  description:
    "Workshops, childbirth education, and community gatherings from The Nesting Place for families in Northern New Jersey, New York, Connecticut, and Pennsylvania.",
  path: "/events-and-classes",
  keywords: [
    "childbirth education New Jersey",
    "prenatal classes Northern NJ",
    "new mom support groups NY",
  ],
});

export default async function EventsAndClassesPage() {
  const items = await fetchPublishedEvents();
  const classes = items.filter((item) => item.kind === "class");
  const events = items.filter((item) => item.kind === "event");

  const renderCard = (item: (typeof items)[number]) => (
    <article
      key={item.slug}
      className="flex h-full flex-col rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm transition hover:border-nurture-sage/30 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-nurture-cream px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nurture-charcoal/70">
          {kindLabel(item.kind)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${listingStatusBadgeClass(item.listingStatus)}`}
        >
          {LISTING_STATUS_LABELS[item.listingStatus]}
        </span>
      </div>
      <time
        dateTime={item.eventDate}
        className="mt-3 text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark"
      >
        {formatEventDate(item.eventDate)}
      </time>
      <h3 className="mt-2 font-serif text-xl font-semibold text-nurture-charcoal">
        <Link
          href={`/events-and-classes/${item.slug}`}
          className="hover:text-nurture-sage-dark"
        >
          {item.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-nurture-charcoal/70">
        {formatLabel(item.format)}
        {item.location ? ` · ${item.location}` : ""}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-nurture-charcoal/75">
        {item.excerpt}
      </p>
      <Link
        href={`/events-and-classes/${item.slug}`}
        className="mt-4 text-sm font-semibold text-nurture-sage-dark hover:underline"
      >
        View details →
      </Link>
    </article>
  );

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <Breadcrumb pageName="Events & Classes" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Learn, connect, and prepare"
            subtitle={`Classes and community events from ${brands.nestingPlace.name} — in person, virtual, and hybrid.`}
            centered
          />

          {items.length === 0 ? (
            <p className="mt-12 text-center text-nurture-charcoal/60">
              New sessions are being scheduled. Contact us to get on the list.
            </p>
          ) : (
            <div className="mt-12 space-y-14">
              {classes.length > 0 ? (
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                    Classes
                  </h2>
                  <ul className="mt-6 grid gap-8 md:grid-cols-2">{classes.map(renderCard)}</ul>
                </div>
              ) : null}
              {events.length > 0 ? (
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                    Events
                  </h2>
                  <ul className="mt-6 grid gap-8 md:grid-cols-2">{events.map(renderCard)}</ul>
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-16 rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
              {classRefundPolicy.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-nurture-charcoal/75">
              {classRefundPolicy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-nurture-sage/20 bg-nurture-sage/5 p-8 text-center">
            <p className="text-nurture-charcoal/80">
              Don&apos;t see what you need? We&apos;re adding sessions regularly.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
