"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const Hero = () => {
  return (
    <section className="floating-header-offset relative min-h-[85vh] overflow-hidden pb-16 sm:min-h-[90vh] sm:pb-20">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/branding/momanddoula.jpg"
          alt="A mother and doula gently supporting a newborn together in a bright, welcoming home"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-[48%_82%] sm:object-[50%_76%] md:object-[50%_70%] lg:object-[52%_66%]"
        />
      </div>

      <div className="relative z-10 px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:pl-10 lg:pr-8">
        <div className="hero-intro-card mr-auto ml-8 w-full max-w-[min(100%,27.72rem)] sm:ml-12 sm:max-w-[min(92%,33rem)] md:ml-16 md:max-w-[min(56%,36.96rem)] lg:ml-20 lg:max-w-[min(56%,39.6rem)]">
          <p className="text-sm font-semibold uppercase tracking-widest text-nurture-grape">
            {brands.nestingPlace.tagline}
          </p>
          <ScrollRevealHeading
            as="h1"
            variant="emphasis"
            className="mt-4 font-serif text-3xl font-semibold leading-tight text-nurture-charcoal sm:mt-5 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]"
          >
            Maternal support, coordinated for every stage of{" "}
            <em className="italic">motherhood</em>
          </ScrollRevealHeading>
          <p className="mt-4 text-base leading-relaxed text-nurture-charcoal/90 sm:mt-5 sm:text-[1.05rem] lg:mt-6">
            An experienced maternal wellness and postpartum support practice offering{" "}
            <strong>birth doula support</strong>, <strong>overnight newborn care</strong>,{" "}
            <strong>postpartum support</strong>, <strong>lactation support</strong>, and{" "}
            <strong>prenatal massage</strong> — with real people guiding you from your first call
            through every stage of motherhood.
          </p>
          <div className="mt-6 sm:mt-7">
            <Link
              href={buildCareStartHref()}
              className="btn-primary-lg"
            >
              Request support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
