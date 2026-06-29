"use client";

import ServicesLandingCard from "@/components/Services/ServicesLandingCard";
import type { ServiceDetail } from "@/content/serviceDetails";
import type { SourceCitation } from "@/content/sources";
import type { CoreService } from "@/content/site";
import type { RelatedBlogPost } from "@/lib/blog/serviceTags";
import { useEffect, useState } from "react";

const shellBaseClass =
  "w-full md:w-[calc((100%-2rem)/3)] md:max-w-[calc((100%-2rem)/3)] md:flex-none md:shrink-0 transition-[width,max-width] duration-500 ease-premium motion-reduce:transition-none md:hover:w-[min(100%,calc(((100%-2rem)/3)*2.75))] md:hover:max-w-[min(100%,calc(((100%-2rem)/3)*2.75))] md:focus-within:w-[min(100%,calc(((100%-2rem)/3)*2.75))] md:focus-within:max-w-[min(100%,calc(((100%-2rem)/3)*2.75))]";

const shellExpandedClass =
  "md:w-[min(100%,calc(((100%-2rem)/3)*2.75))] md:max-w-[min(100%,calc(((100%-2rem)/3)*2.75))]";

interface ServicesOrphanCardShellProps {
  service: CoreService;
  detail?: ServiceDetail;
  researchPoints?: string[];
  sources?: SourceCitation[];
  relatedPosts?: RelatedBlogPost[];
}

/** Wraps a lone service card so it matches three-up width and expands on hover. */
const ServicesOrphanCardShell = ({
  service,
  detail,
  researchPoints = [],
  sources = [],
  relatedPosts = [],
}: ServicesOrphanCardShellProps) => {
  const [hashActive, setHashActive] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      setHashActive(window.location.hash === `#${service.slug}`);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [service.slug]);

  return (
    <div className={`${shellBaseClass} ${hashActive ? shellExpandedClass : ""}`.trim()}>
      <ServicesLandingCard
        layout="accordion"
        accordionOrphan
        service={service}
        detail={detail}
        researchPoints={researchPoints}
        sources={sources}
        relatedPosts={relatedPosts}
      />
    </div>
  );
};

export default ServicesOrphanCardShell;
