"use client";

import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import { MARKETING_CREAM } from "@/config/marketingDesign";

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <section
      className="floating-header-offset relative overflow-hidden bg-gradient-to-b from-nurture-rose-light/50 via-nurture-blush/30 to-nurture-cream pb-20 pt-4 sm:pb-24"
    >
      <SectionWaveEdges bottomOnly bottomFill={MARKETING_CREAM} />
      <div className="relative z-[2] mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nurture-sage-dark">
          The Nesting Place
        </p>
        <ScrollRevealHeading
          as="h1"
          variant="soft"
          className="mt-2 font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl"
        >
          {pageName}
        </ScrollRevealHeading>
      </div>
    </section>
  );
};

export default Breadcrumb;
