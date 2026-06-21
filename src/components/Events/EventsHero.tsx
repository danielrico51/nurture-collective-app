"use client";

import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import HeroBlendImage from "@/components/Common/HeroBlendImage";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import {
  eventsHeroIllustrationAlt,
  eventsHeroIllustrationSrc,
} from "@/config/eventsMarketing";
import { MARKETING_CREAM } from "@/config/marketingDesign";
import { brands } from "@/content/site";
import Link from "next/link";
const EventsHero = () => (
  <section className="floating-header-offset relative overflow-hidden bg-gradient-to-b from-nurture-rose-light/50 via-nurture-blush/30 to-nurture-cream pb-16 sm:pb-20">
    <SectionWaveEdges bottomOnly bottomFill={MARKETING_CREAM} />
    <div className="relative z-[2] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative z-10 text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
            {brands.nestingPlace.tagline}
          </p>
          <ScrollRevealHeading
            as="h1"
            variant="emphasis"
            className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:mt-6 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]"
          >
            Learn, connect, and{" "}
            <em className="italic">prepare together</em>
          </ScrollRevealHeading>
          <p className="mt-5 text-base leading-relaxed text-nurture-charcoal/80 sm:mt-6 sm:text-lg lg:mt-8 lg:text-xl">
            Childbirth education, workshops, and community gatherings — in
            person, virtual, and hybrid — for families across our service area.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#events-listings" className="btn-primary-lg">
              Explore sessions
            </a>
            <Link href="/contact" className="btn-secondary-lg">
              Ask a question
            </Link>
          </div>
        </div>

        <HeroBlendImage
          src={eventsHeroIllustrationSrc}
          alt={eventsHeroIllustrationAlt}
          priority
        />      </div>
    </div>
  </section>
);

export default EventsHero;
