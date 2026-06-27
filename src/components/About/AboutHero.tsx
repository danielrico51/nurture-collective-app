"use client";

import HeroBlendImage from "@/components/Common/HeroBlendImage";
import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { pageArtwork } from "@/config/pageArtwork";
import { MARKETING_CREAM, marketingHeroGradient, marketingEyebrow } from "@/config/marketingDesign";
import { brands } from "@/content/site";

const AboutHero = () => (
  <section className={`floating-header-offset relative overflow-hidden ${marketingHeroGradient} pb-16 sm:pb-20`}>
    <SectionWaveEdges bottomOnly bottomFill={MARKETING_CREAM} />
    <div className="relative z-[2] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative z-10 text-left">
          <p className={marketingEyebrow}>
            {brands.nestingPlace.name}
          </p>
          <ScrollRevealHeading
            as="h1"
            variant="emphasis"
            className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:mt-6 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]"
          >
            Every mother deserves a <em className="italic">team</em>
          </ScrollRevealHeading>
          <p className="mt-3 text-sm text-nurture-charcoal/65">
            {brands.nestingPlace.operatorLine}
          </p>

          <div className="mt-8 space-y-5 text-base leading-relaxed text-nurture-charcoal/80 sm:mt-10 sm:text-lg">
            <p>
              Motherhood is one of life&apos;s most profound transitions — and
              too often, families navigate it with fragmented resources and
              little rest. {brands.nestingPlace.name} exists so every mother
              has a team: vetted maternal wellness professionals and a
              dedicated support coordinator who knows your name.
            </p>
            <p>
              We began in Northern New Jersey and the Lower Hudson Valley with
              a simple promise: every mother deserves a team and a coordinator
              who knows her by name — and we welcome families wherever they
              are.
            </p>
          </div>
        </div>

        <HeroBlendImage
          src={pageArtwork.aboutCoffee.src}
          alt={pageArtwork.aboutCoffee.alt}
          priority
        />
      </div>
    </div>
  </section>
);

export default AboutHero;
