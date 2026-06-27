"use client";

import HeroBlendImage from "@/components/Common/HeroBlendImage";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import SectionWaveEdges, { FOOTER_SECTION_CLASS } from "@/components/Common/SectionWaveEdges";
import { pageArtwork } from "@/config/pageArtwork";
import Link from "next/link";

import { MARKETING_CREAM, MARKETING_OAK_SURFACE, marketingEyebrow } from "@/config/marketingDesign";

const JoinTeamSection = () => (
  <section
    className={`${FOOTER_SECTION_CLASS} pt-20 sm:pt-24`}
    style={{ backgroundColor: MARKETING_OAK_SURFACE }}
  >
    <SectionWaveEdges topOnly topFill={MARKETING_CREAM} />
    <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <HeroBlendImage
          src={pageArtwork.homeClosing.src}
          alt={pageArtwork.homeClosing.alt}
          blend="strong"
          blendSurface="cream"
          className="lg:mx-0 lg:translate-x-0"
        />

        <div className="text-center lg:text-left">
          <p className={marketingEyebrow}>
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
