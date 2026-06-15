import { EventBody } from "@/components/Events/EventBody";
import { EventDigest } from "@/components/Events/EventDigest";
import EventQuestionsCta from "@/components/Events/EventQuestionsCta";
import Breadcrumb from "@/components/Common/Breadcrumb";
import {
  formatEventDate,
  formatEventPrice,
  formatEventSchedule,
  formatLabel,
  kindLabel,
  listingStatusBadgeClass,
  LISTING_STATUS_LABELS,
  REGISTRATION_MODE_LABELS,
} from "@/lib/events/format";
import {
  getClassAvailabilityForEvent,
  isOnlineRegistrationEnabled,
} from "@/lib/classRegistrations/service";
import { buildPageMetadata } from "@/config/seo";
import { fetchPublishedEvent, fetchPublishedEvents } from "@/lib/events/public";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const item = await fetchPublishedEvent(params.slug);
  if (!item) {
    return buildPageMetadata({
      title: "Events & Classes",
      description: "Events and classes from The Nesting Place.",
      path: "/events-and-classes",
    });
  }
  return buildPageMetadata({
    title: item.title,
    description: item.excerpt,
    path: `/events-and-classes/${item.slug}`,
    keywords: [
      item.kind === "class" ? "childbirth class" : "maternal wellness event",
      "The Nesting Place events",
    ],
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const item = await fetchPublishedEvent(params.slug);
  if (!item) notFound();

  const related = (await fetchPublishedEvents())
    .filter((entry) => entry.slug !== item.slug && entry.kind === item.kind)
    .slice(0, 3);

  const availability = isOnlineRegistrationEnabled(item)
    ? await getClassAvailabilityForEvent(item)
    : null;
  const priceLabel = formatEventPrice(item.priceCents);
  const scheduleLabel = formatEventSchedule(item.eventDate, item.startTime);

  const ctaHref = isOnlineRegistrationEnabled(item)
    ? `/events-and-classes/${item.slug}/register`
    : item.registrationMode === "external" &&
        (item.registrationUrl?.startsWith("http") ||
          item.registrationUrl?.startsWith("/"))
      ? item.registrationUrl
      : "/contact";

  const ctaLabel = isOnlineRegistrationEnabled(item)
    ? availability?.registrationOpen
      ? availability.spotsRemaining === 0 && availability.waitlistEnabled
        ? "Join waitlist"
        : "Register online"
      : "Registration closed"
    : item.listingStatus === "contact"
      ? "Contact us to register"
      : "Register or inquire";

  return (
    <>
      <Breadcrumb pageName="Events & Classes" />
      <article className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/events-and-classes"
            className="text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            ← All events & classes
          </Link>

          <header className="mt-8 border-b border-nurture-sage/15 pb-8">
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
              className="mt-4 block text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark"
            >
              {formatEventDate(item.eventDate)}
            </time>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-nurture-charcoal sm:text-4xl">
              {item.title}
            </h1>
            <p className="mt-3 text-sm text-nurture-charcoal/70">
              {formatLabel(item.format)}
              {item.location ? ` · ${item.location}` : ""}
              {priceLabel ? ` · ${priceLabel}` : ""}
            </p>
            {item.startTime ? (
              <p className="mt-2 text-sm text-nurture-charcoal/65">{scheduleLabel}</p>
            ) : null}
            {availability ? (
              <p className="mt-2 text-sm font-medium text-nurture-sage-dark">
                {availability.capacity === null
                  ? "Open registration"
                  : availability.spotsRemaining === 0
                    ? availability.waitlistEnabled
                      ? "Full — waitlist available"
                      : "Full"
                    : `${availability.spotsRemaining} spot${availability.spotsRemaining === 1 ? "" : "s"} remaining`}
                {" · "}
                {REGISTRATION_MODE_LABELS.online}
              </p>
            ) : null}
            {item.instructorName ? (
              <p className="mt-2 text-sm text-nurture-charcoal/65">
                Instructor: {item.instructorName}
              </p>
            ) : null}
            {item.excerpt ? (
              <p className="mt-4 text-lg text-nurture-charcoal/75">{item.excerpt}</p>
            ) : null}
          </header>

          {item.body ? (
            <div className="mt-10">
              <EventBody body={item.body} />
            </div>
          ) : null}

          {item.faq && item.faq.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-serif text-xl font-semibold text-nurture-charcoal">
                Frequently asked questions
              </h2>
              <dl className="mt-4 space-y-4">
                {item.faq.map((entry) => (
                  <div
                    key={entry.question}
                    className="rounded-xl border border-nurture-sage/15 bg-nurture-cream/30 p-4"
                  >
                    <dt className="font-semibold text-nurture-charcoal">
                      {entry.question}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-nurture-charcoal/75">
                      {entry.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <EventDigest slug={item.slug} title={item.title} kind={item.kind} />

          <EventQuestionsCta eventTitle={item.title} />

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              aria-disabled={
                isOnlineRegistrationEnabled(item) && !availability?.registrationOpen
              }
              className={`rounded-full px-6 py-2.5 text-sm font-semibold ${
                isOnlineRegistrationEnabled(item) && !availability?.registrationOpen
                  ? "pointer-events-none bg-nurture-charcoal/20 text-nurture-charcoal/50"
                  : "bg-nurture-sage text-white hover:bg-nurture-sage-dark"
              }`}
            >
              {ctaLabel}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Ask a question
            </Link>
          </div>

          {related.length > 0 ? (
            <aside className="mt-16 rounded-2xl border border-nurture-sage/15 bg-nurture-cream/40 p-6">
              <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
                More {item.kind === "class" ? "classes" : "events"}
              </h2>
              <ul className="mt-4 space-y-3">
                {related.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/events-and-classes/${entry.slug}`}
                      className="text-sm font-medium text-nurture-sage-dark hover:underline"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </article>
    </>
  );
}
