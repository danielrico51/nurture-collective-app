import {
  formatEventPrice,
  formatEventSchedule,
  kindLabel,
  listingStatusBadgeClass,
  LISTING_STATUS_LABELS,
} from "@/lib/events/format";
import type { EventItem } from "@/types/event";
import Link from "next/link";

interface EventsListingCardProps {
  item: EventItem;
}

const EventsListingCard = ({ item }: EventsListingCardProps) => {
  const priceLabel = formatEventPrice(item.priceCents);
  const detailHref = `/events-and-classes/${item.slug}`;

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white p-5 shadow-[0_14px_35px_rgba(45,52,54,0.07)] transition hover:border-nurture-rose/30 hover:shadow-[0_18px_45px_rgba(45,52,54,0.1)] sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-nurture-cream px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-nurture-charcoal/70">
          {kindLabel(item.kind)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${listingStatusBadgeClass(item.listingStatus)}`}
        >
          {LISTING_STATUS_LABELS[item.listingStatus]}
        </span>
      </div>

      <time
        dateTime={item.eventDate}
        className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-nurture-sage-dark"
      >
        {formatEventSchedule(item.eventDate, item.startTime)}
      </time>

      <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-nurture-charcoal">
        <Link
          href={detailHref}
          className="transition-colors hover:text-nurture-sage-dark"
        >
          {item.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm text-nurture-charcoal/70">
        {item.format}
        {item.location ? ` · ${item.location}` : ""}
        {priceLabel ? ` · ${priceLabel}` : ""}
      </p>

      {item.instructorName ? (
        <p className="mt-2 text-xs text-nurture-charcoal/55">
          Led by {item.instructorName}
        </p>
      ) : null}

      <p className="mt-3 flex-1 text-sm leading-relaxed text-nurture-charcoal/75">
        {item.excerpt}
      </p>

      <div className="mt-5">
        <Link href={detailHref} className="btn-secondary !text-xs">
          View details
        </Link>
      </div>
    </article>
  );
};

export default EventsListingCard;
