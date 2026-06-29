"use client";

import ImpactAccordion from "@/components/Home/ImpactAccordion";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { SECTION_ABOVE_WAVE_OVERLAP_CLASS } from "@/components/Common/SectionWaveEdges";
import { buildCareStartHref } from "@/config/carePaths";
import { MARKETING_OAK_SURFACE } from "@/config/marketingDesign";
import Link from "next/link";

const ServiceStatsSection = () => {
  return (
    <section
      className={`${SECTION_ABOVE_WAVE_OVERLAP_CLASS} py-12 sm:py-14`}
      style={{ backgroundColor: MARKETING_OAK_SURFACE }}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollRevealHeading
            variant="default"
            className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl"
          >
            Support that makes a measurable difference
          </ScrollRevealHeading>
          <p className="mt-3 text-lg text-nurture-charcoal/70">
            Our core services are backed by research on better outcomes for moms
            and babies — with real people delivering every step of support.
          </p>
        </div>

        <div className="mt-10">
          <ImpactAccordion />
        </div>

        <p className="mt-8 text-center text-xs text-nurture-charcoal/55">
          Statistics are drawn from published research. See our{" "}
          <Link href="/sources" className="font-medium text-nurture-grape hover:underline">
            Sources
          </Link>{" "}
          page for citations.
        </p>

        <div className="mt-8 text-center sm:mt-10">
          <Link href={buildCareStartHref()} className="btn-primary-lg">
            Request support
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServiceStatsSection;
