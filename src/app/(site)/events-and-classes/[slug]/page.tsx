import { EventBody } from "@/components/Events/EventBody";
import Breadcrumb from "@/components/Common/Breadcrumb";
import {
  formatEventDate,
  formatLabel,
  kindLabel,
  listingStatusBadgeClass,
  LISTING_STATUS_LABELS,
} from "@/lib/events/format";
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
  if (!item) return { title: "Events & Classes | The Nesting Place" };
  return {
    title: `${item.title} | The Nesting Place`,
    description: item.excerpt,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const item = await fetchPublishedEvent(params.slug);
  if (!item) notFound();

  const related = (await fetchPublishedEvents())
    .filter((entry) => entry.slug !== item.slug && entry.kind === item.kind)
    .slice(0, 3);

  const ctaHref =
    item.registrationUrl?.startsWith("http") || item.registrationUrl?.startsWith("/")
      ? item.registrationUrl
      : "/contact";

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
            </p>
            {item.excerpt ? (
              <p className="mt-4 text-lg text-nurture-charcoal/75">{item.excerpt}</p>
            ) : null}
          </header>

          {item.body ? (
            <div className="mt-10">
              <EventBody body={item.body} />
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
            >
              {item.listingStatus === "contact"
                ? "Contact us to register"
                : "Register or inquire"}
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
