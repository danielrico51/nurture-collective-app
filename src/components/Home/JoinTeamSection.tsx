"use client";

import HeroBlendImage from "@/components/Common/HeroBlendImage";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import { pageArtwork } from "@/config/pageArtwork";
import Link from "next/link";

const NURTURE_CREAM = "#FAF7F2";

const JoinTeamSection = () => (
  <section className="relative overflow-hidden bg-white pb-16 pt-20 sm:pb-20 sm:pt-24">
    <SectionWaveEdges topOnly topFill={NURTURE_CREAM} />
    <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <HeroBlendImage
          src={pageArtwork.homeClosing.src}
          alt={pageArtwork.homeClosing.alt}
          blend="strong"
          blendSurface="white"
          className="lg:mx-0 lg:translate-x-0"
        />

        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            We&apos;re growing
          </p>
          <ScrollRevealHeading
            variant="quick"
            className="mt-3 font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl"
          >
            Interested in joining our team?
          </ScrollRevealHeading>
          <p className="mx-auto mt-4 max-w-lg text-sm text-nurture-charcoal/70 lg:mx-0">
            We&apos;re building a thoughtful provider network. If you share our
            commitment to family-centered support, we&apos;d love to hear from you.
          </p>
          <Link href="/for-providers" className="btn-primary-lg mt-6">
            Learn about joining our team
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default JoinTeamSection;
