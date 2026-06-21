"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const TeamBylineBanner = () => {
  return (
    <section className="relative overflow-hidden bg-nurture-cream py-12 sm:py-16 md:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[6%] bottom-[8%] -z-10 hidden opacity-50 sm:block md:-left-[2%] md:bottom-[4%] md:opacity-55 lg:bottom-[2%] lg:opacity-60"
      >
        <Image
          src="/images/landing-decor/vase-lilac.png"
          alt=""
          width={480}
          height={480}
          className="h-auto w-[11rem] max-w-none md:w-[14rem] lg:w-[17rem]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div
          className="team-byline-card relative mx-auto max-w-5xl px-8 py-14 text-center text-white shadow-floatingCard sm:px-16 sm:py-16"
        >
          <ScrollRevealHeading
            as="h2"
            variant="soft"
            className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.2]"
          >
            {brands.nestingPlace.byline}
          </ScrollRevealHeading>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/90">
            {brands.nestingPlace.bylineDescription}
          </p>
          <div className="mt-8 sm:mt-10">
            <Link
              href={buildCareStartHref()}
              className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark transition-colors hover:bg-nurture-cream"
            >
              Request support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamBylineBanner;
