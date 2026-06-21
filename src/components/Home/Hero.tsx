"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const Hero = () => {
  return (
    <section className="floating-header-offset relative overflow-hidden bg-gradient-to-b from-nurture-rose-light/50 via-nurture-blush/30 to-nurture-cream pb-16 sm:pb-20">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="relative z-10 text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              {brands.nestingPlace.tagline}
            </p>
            <ScrollRevealHeading
              as="h1"
              variant="emphasis"
              className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:mt-6 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] xl:text-[3.75rem]"
            >
              Maternal support, coordinated for every stage of{" "}
              <em className="italic">motherhood</em>
            </ScrollRevealHeading>
            <p className="mt-5 text-base leading-relaxed text-nurture-charcoal/80 sm:mt-6 sm:text-lg lg:mt-8 lg:text-xl">
              An experienced maternal wellness and postpartum support practice offering{" "}
              <span className="hero-service-highlight hero-service-highlight--a">
                birth doula support
              </span>,{" "}
              <span className="hero-service-highlight hero-service-highlight--b">
                overnight newborn care
              </span>,{" "}
              <span className="hero-service-highlight hero-service-highlight--c">
                postpartum support
              </span>,{" "}
              <span className="hero-service-highlight hero-service-highlight--d">
                lactation support
              </span>, and{" "}
              <span className="hero-service-highlight hero-service-highlight--e">
                prenatal massage
              </span> — with real
              people guiding you from your first call through every stage of motherhood.
            </p>
            <div className="mt-8">
              <Link
                href={buildCareStartHref()}
                className="btn-primary-lg"
              >
                Request support
              </Link>
            </div>
          </div>

          <div className="relative z-0 mx-auto w-full max-w-[47.628rem] lg:mx-0 lg:ml-auto lg:max-w-none lg:-translate-x-[10%]">
            <div
              aria-hidden
              className="absolute inset-6 rounded-[2.75rem] bg-nurture-rose-light/50 blur-3xl"
            />
            <div className="relative px-2 py-3 sm:px-4 sm:py-4 lg:origin-left lg:scale-[1.323]">
              <div className="hero-image-blend overflow-hidden rounded-3xl">
                <Image
                  src="/images/hero-home.png"
                  alt="Two caregivers gently supporting a newborn baby together in a bright, welcoming home"
                  width={1024}
                  height={682}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2 rounded-3xl bg-gradient-to-r from-nurture-rose-light/50 via-transparent to-nurture-rose-light/40 sm:inset-4"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2 rounded-3xl bg-gradient-to-b from-nurture-rose-light/35 via-transparent to-nurture-cream/55 sm:inset-4"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
