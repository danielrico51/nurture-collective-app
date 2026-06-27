"use client";

import SectionTitle from "@/components/Common/SectionTitle";
import type { GoogleReview, GoogleReviewsPayload } from "@/types/googleReview";
import { useEffect, useState, type ReactNode } from "react";
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <span
        key={index}
        className={
          index < Math.round(rating) ? "text-nurture-gold" : "text-nurture-charcoal/20"
        }
      >
        ★
      </span>
    ))}
  </div>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden
    className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ReviewSnippetProps {
  review: GoogleReview;
  isOpen: boolean;
  onToggle: () => void;
}

const ReviewSnippet = ({ review, isOpen, onToggle }: ReviewSnippetProps) => {
  const panelId = `review-${review.id}`;

  return (
    <div className="py-3">
      <button
        type="button"
        className="flex min-h-[44px] w-full items-start justify-between gap-3 py-2 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-nurture-charcoal">{review.authorName}</span>
            <StarRating rating={review.rating} />
          </span>
          {review.relativeTime ? (
            <span className="mt-0.5 block text-xs text-nurture-charcoal/50">
              {review.relativeTime}
            </span>
          ) : null}
        </span>
        <span className="pt-0.5 text-nurture-grape">
          <ChevronIcon expanded={isOpen} />
        </span>
      </button>
      <div
        id={panelId}
        aria-hidden={!isOpen}
        className={
          isOpen
            ? "mt-2 text-sm leading-relaxed text-nurture-charcoal/75"
            : "sr-only text-sm leading-relaxed text-nurture-charcoal/75"
        }
      >
        {review.text}
      </div>
    </div>
  );
};

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviewsSection = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => (
  <section className={`relative overflow-hidden py-8 sm:py-10 ${className}`}>
    <div className="relative z-[1] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  </section>
);

const GoogleReviews = ({ className = "" }: GoogleReviewsProps) => {
  const [data, setData] = useState<GoogleReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReviewIds, setOpenReviewIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    fetch("/api/reviews")
      .then(async (response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error("Could not load reviews");
        }

        const payload = (await response.json()) as
          | GoogleReviewsPayload
          | { error?: string; fallback?: GoogleReviewsPayload };

        if (!response.ok) {
          if ("fallback" in payload && payload.fallback) {
            setData(payload.fallback);
            return;
          }
          throw new Error(
            ("error" in payload && payload.error) || "Could not load reviews"
          );
        }

        setData(payload as GoogleReviewsPayload);
      })
      .catch(() => {
        setError("Could not load reviews");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GoogleReviewsSection className={className}>
        <p className="text-center text-sm text-nurture-charcoal/60">
          Loading reviews…
        </p>
      </GoogleReviewsSection>
    );
  }

  if (error || !data) {
    return (
      <GoogleReviewsSection className={className}>
        <p className="text-center text-sm text-red-700/90">
          {error ?? "Could not load reviews"}
        </p>
      </GoogleReviewsSection>
    );
  }

  return (
    <GoogleReviewsSection className={className}>
        {data.isPlaceholder ? (
          <div className="mb-4 rounded-xl border border-nurture-oak/50 bg-nurture-oak/30 px-4 py-2.5 text-center text-sm text-nurture-grape">
            <span className="font-semibold">Preview only</span> — sample reviews
            for layout. Connect Google Business Profile after acquisition to
            show live ratings.
          </div>
        ) : null}

        <SectionTitle
          title="What families are saying"
          revealVariant="default"
          subtitle={
            data.isPlaceholder
              ? "Placeholder social proof — real Google reviews will appear here after integration."
              : "Rated on Google by families in our network."
          }
        />

        <div className="mx-auto mt-4 flex max-w-xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-3">
          <StarRating rating={data.rating} />
          <p className="text-sm text-nurture-charcoal/70">
            <span className="font-semibold text-nurture-charcoal">
              {data.rating.toFixed(1)}
            </span>{" "}
            · {data.reviewCount} Google reviews
          </p>
          {data.googleMapsUrl ? (
            <a
              href={data.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-nurture-grape hover:underline"
            >
              See all on Google →
            </a>
          ) : null}
        </div>

        {data.reviews.length > 0 ? (
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-2">
            {data.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-nurture-oak/40 bg-nurture-cream px-4 shadow-sm transition hover:border-nurture-lilac/35"
              >
                <ReviewSnippet
                  review={review}
                  isOpen={openReviewIds.has(review.id)}
                  onToggle={() =>
                    setOpenReviewIds((current) => {
                      const next = new Set(current);
                      if (next.has(review.id)) next.delete(review.id);
                      else next.add(review.id);
                      return next;
                    })
                  }
                />
              </article>
            ))}
          </div>
        ) : null}

        {!data.googleMapsUrl ? (
          <p className="mt-4 text-center text-xs text-nurture-charcoal/45">
            Set{" "}
            <code className="rounded bg-nurture-cream px-1.5 py-0.5">
              NEXT_PUBLIC_GOOGLE_REVIEWS_URL
            </code>{" "}
            or{" "}
            <code className="rounded bg-nurture-cream px-1.5 py-0.5">
              GOOGLE_PLACE_ID
            </code>{" "}
            when your Google Business Profile is ready.
          </p>
        ) : null}
    </GoogleReviewsSection>
  );
};

export default GoogleReviews;
