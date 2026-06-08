"use client";

import LeafMark from "@/components/Art/LeafMark";
import ServiceIllustration from "@/components/Services/ServiceIllustration";
import { buildCareStartHref } from "@/config/carePaths";
import type { ServiceDetail } from "@/content/serviceDetails";
import type { SourceCitation } from "@/content/sources";
import type { CoreService } from "@/content/site";
import type { RelatedBlogPost } from "@/lib/blog/serviceTags";
import Link from "next/link";
import { useId, useState } from "react";

interface ServicesLandingCardProps {
  service: CoreService;
  featured?: boolean;
  detail?: ServiceDetail;
  researchPoints?: string[];
  sources?: SourceCitation[];
  relatedPosts?: RelatedBlogPost[];
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden
    className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ServicesLandingCard = ({
  service,
  featured = false,
  detail,
  researchPoints = [],
  sources = [],
  relatedPosts = [],
}: ServicesLandingCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const hasExpandableContent = Boolean(
    service.benefit ||
      detail?.whatToExpect.length ||
      researchPoints.length ||
      relatedPosts.length ||
      sources.length
  );

  return (
    <article
      className={`group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white shadow-[0_14px_35px_rgba(45,52,54,0.07)] transition hover:border-nurture-rose/30 hover:shadow-[0_18px_45px_rgba(45,52,54,0.1)] ${
        featured ? "p-4 sm:p-5" : "p-4"
      }`}
    >
      <div className="flex min-h-0 flex-1">
        <div className="w-[40%] shrink-0 self-center overflow-hidden rounded-[1.35rem] bg-nurture-cream/70">
          <ServiceIllustration
            slug={service.slug}
            className={featured ? "h-32 w-full sm:h-36" : "h-28 w-full sm:h-32"}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-1 pl-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nurture-sage-dark/80">
            {service.tag}
          </span>
          <h2
            className={`mt-2 font-serif font-semibold leading-tight text-nurture-charcoal ${
              featured ? "text-xl" : "text-lg"
            }`}
          >
            {service.title}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed text-nurture-charcoal/70">
            {service.description}
          </p>

          {service.availabilityNote ? (
            <p className="mt-2 text-[11px] leading-relaxed text-nurture-charcoal/55">
              {service.availabilityNote}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasExpandableContent ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpanded((open) => !open)}
                className="inline-flex items-center gap-1 rounded-full border border-nurture-sage/25 px-3 py-1.5 text-[11px] font-semibold text-nurture-sage-dark transition hover:border-nurture-sage/45 hover:bg-nurture-sage/5"
              >
                {expanded ? "Show less" : "Learn more"}
                <ChevronIcon expanded={expanded} />
              </button>
            ) : null}
            <Link
              href={buildCareStartHref(service.slug)}
              className="inline-flex items-center rounded-full bg-nurture-sage px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-nurture-sage-dark"
            >
              Request support
            </Link>
          </div>
        </div>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="mt-4 border-t border-nurture-sage/10 pt-4 text-[13px] leading-relaxed text-nurture-charcoal/75"
        >
          {service.benefit ? (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
                Why it helps
              </h3>
              <p className="mt-2 font-medium text-nurture-charcoal/85">
                {service.benefit}
              </p>
            </div>
          ) : null}

          {detail?.whatToExpect.length ? (
            <div className={service.benefit ? "mt-4" : ""}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
                What to expect
              </h3>
              <ul className="mt-2 space-y-2">
                {detail.whatToExpect.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-sage"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {researchPoints.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
                Research highlights
              </h3>
              <ul className="mt-2 space-y-2">
                {researchPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-rose"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {relatedPosts.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-nurture-sage-dark/80">
                Related reading
              </h3>
              <ul className="mt-2 space-y-2">
                {relatedPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-semibold text-nurture-sage-dark hover:underline"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {sources.length > 0 ? (
            <p className="mt-4 text-[11px] text-nurture-charcoal/55">
              Statistics drawn from published research.{" "}
              <Link href="/sources" className="font-medium text-nurture-sage-dark hover:underline">
                See all sources
              </Link>
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-nurture-sage/10 pt-4">
            <Link
              href={buildCareStartHref(service.slug)}
              className="inline-flex items-center gap-2 rounded-full bg-nurture-rose px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-rose-dark"
            >
              Get support for {service.title.toLowerCase()}
            </Link>
            <LeafMark className="h-4 w-4 opacity-65" />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <LeafMark className="h-4 w-4 opacity-65 transition group-hover:opacity-100" />
        </div>
      )}
    </article>
  );
};

export default ServicesLandingCard;
