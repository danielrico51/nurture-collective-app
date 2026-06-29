"use client";

import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { buildCareStartHref } from "@/config/carePaths";
import {
  servicesHeroIllustrationAlt,
  servicesHeroIllustrationSrc,
} from "@/config/serviceIllustrations";
import {
  MARKETING_CREAM,
  marketingEyebrow,
  marketingHeroGradient,
} from "@/config/marketingDesign";
import { brands } from "@/content/site";
import Image from "next/image";
import Link from "next/link";

const ServicesHero = () => (
  <section className={`floating-header-offset relative overflow-hidden ${marketingHeroGradient} pb-16 sm:pb-20`}>
    <SectionWaveEdges bottomOnly bottomFill={MARKETING_CREAM} />
    <div className="relative z-[2] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative z-10 text-left">
          <p className={marketingEyebrow}>
            {brands.nestingPlace.tagline}
          </p>
          <ScrollRevealHeading
            as="h1"
            variant="emphasis"
            className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:mt-6 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]"
          >
            Every step of your{" "}
            <em className="italic">maternity journey</em>
          </ScrollRevealHeading>
          <p className="mt-5 text-base leading-relaxed text-nurture-charcoal/80 sm:mt-6 sm:text-lg lg:mt-8 lg:text-xl">
            Evidence-based support, nurturing care, and expert guidance for you
            and your growing family — from pregnancy through the fourth
            trimester.
          </p>
          <div className="mt-8">
            <Link href={buildCareStartHref()} className="btn-primary-lg">
              Request support
            </Link>
          </div>
        </div>

        <div className="relative z-0 mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none lg:-translate-x-[6%]">
          <div
            aria-hidden
            className="absolute inset-6 rounded-[2.75rem] bg-nurture-rose-light/45 blur-3xl"
          />
          <div className="relative px-2 py-3 sm:px-4 sm:py-4">
            <div className="hero-image-blend overflow-hidden rounded-3xl">
              <Image
                src={servicesHeroIllustrationSrc}
                alt={servicesHeroIllustrationAlt}
                width={1024}
                height={768}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-2 rounded-3xl bg-gradient-to-r from-nurture-rose-light/45 via-transparent to-nurture-blush/30 sm:inset-4"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-2 rounded-3xl bg-gradient-to-b from-nurture-rose-light/30 via-transparent to-nurture-cream/50 sm:inset-4"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ServicesHero;
