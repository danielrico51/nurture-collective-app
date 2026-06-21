"use client";

import ServiceCardExpandedContent from "@/components/Services/ServiceCardExpandedContent";
import ServiceIllustration from "@/components/Services/ServiceIllustration";
import ServicesDecor from "@/components/Services/ServicesDecor";
import { buildCareStartHref } from "@/config/carePaths";
import {
  serviceCardBackgroundSrc,
  serviceCardCornerSrc,
  serviceCardIconSrc,
} from "@/config/servicesDecor";
import type { ServiceDetail } from "@/content/serviceDetails";
import type { SourceCitation } from "@/content/sources";
import type { CoreService } from "@/content/site";
import type { RelatedBlogPost } from "@/lib/blog/serviceTags";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

interface ServicesLandingCardProps {
  service: CoreService;
  detail?: ServiceDetail;
  researchPoints?: string[];
  sources?: SourceCitation[];
  relatedPosts?: RelatedBlogPost[];
  layout?: "grid" | "accordion";
  /** When true, card matches the width of peers in a three-up row instead of stretching full width. */
  accordionOrphan?: boolean;
}

const ACCORDION_MOTION =
  "transition-[flex] duration-500 ease-premium motion-reduce:transition-none";

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
  detail,
  researchPoints = [],
  sources = [],
  relatedPosts = [],
  layout = "grid",
  accordionOrphan = false,
}: ServicesLandingCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [hashActive, setHashActive] = useState(false);
  const panelId = useId();
  const isAccordion = layout === "accordion";

  useEffect(() => {
    const syncFromHash = () => {
      const active = window.location.hash === `#${service.slug}`;
      setExpanded(active);
      setHashActive(active);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [service.slug]);

  const hasExpandableContent = Boolean(
    service.benefit ||
      detail?.whatToExpect.length ||
      researchPoints.length ||
      relatedPosts.length ||
      sources.length,
  );

  const iconSrc = serviceCardIconSrc[service.slug];

  const accordionHoverClass = hashActive
    ? "md:flex-[2.75]"
    : "md:hover:flex-[2.75] md:focus-within:flex-[2.75]";

  const accordionSizeClass = accordionOrphan
    ? "w-full"
    : `md:min-w-0 md:flex-1 ${accordionHoverClass}`;

  return (
    <article
      id={service.slug}
      tabIndex={isAccordion ? 0 : undefined}
      className={`group/card relative flex min-h-full scroll-mt-24 flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_14px_35px_rgba(45,52,54,0.07)] hover:border-nurture-rose/30 hover:shadow-[0_18px_45px_rgba(45,52,54,0.1)] sm:scroll-mt-28 md:scroll-mt-32 ${
        hashActive
          ? "border-nurture-sage/45 ring-2 ring-nurture-sage/25"
          : "border-nurture-sage/15"
      } p-4 sm:p-5 ${
        isAccordion
          ? `w-full md:min-h-[22rem] ${ACCORDION_MOTION} ${accordionSizeClass}`
          : ""
      }`}
    >
      {serviceCardBackgroundSrc[service.slug] ? (
        <ServicesDecor
          src={serviceCardBackgroundSrc[service.slug]!}
          placement="card-background"
        />
      ) : null}
      {iconSrc ? <ServicesDecor src={iconSrc} placement="card-icon" /> : null}
      {serviceCardCornerSrc[service.slug] ? (
        <ServicesDecor
          src={serviceCardCornerSrc[service.slug]!}
          placement="card-corner"
        />
      ) : null}

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col text-center">
        <ServiceIllustration
          slug={service.slug}
          variant="card"
          className="mb-4 w-full shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nurture-sage-dark/80">
            {service.tag}
          </span>
          <h2 className="mt-2 font-serif text-xl font-semibold leading-tight text-nurture-charcoal">
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

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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

      {hasExpandableContent ? (
        <div
          id={panelId}
          aria-hidden={!expanded}
          className={`relative z-[1] border-t border-nurture-sage/10 pt-4 text-left ${
            expanded
              ? "mt-4"
              : "sr-only mt-0 max-h-0 overflow-hidden border-0 pt-0"
          }`}
        >
          <ServiceCardExpandedContent
            service={service}
            detail={detail}
            researchPoints={researchPoints}
            sources={sources}
            relatedPosts={relatedPosts}
          />
        </div>
      ) : null}
    </article>
  );
};

export default ServicesLandingCard;
