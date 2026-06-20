import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import {
  eventsHeroIllustrationAlt,
  eventsHeroIllustrationSrc,
} from "@/config/eventsMarketing";
import { MARKETING_CREAM } from "@/config/marketingDesign";
import { brands } from "@/content/site";
import Image from "next/image";
import Link from "next/link";

const EventsHero = () => (
  <section className="floating-header-offset relative overflow-hidden bg-gradient-to-b from-nurture-rose-light/50 via-nurture-blush/30 to-nurture-cream pb-16 sm:pb-20">
    <SectionWaveEdges bottomOnly bottomFill={MARKETING_CREAM} />
    <div className="relative z-[2] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative z-10 text-left">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-nurture-sage-dark">
            {brands.nestingPlace.tagline}
          </p>
          <h1
            className="mt-4 font-serif text-[clamp(2rem,5vw+0.5rem,3.35rem)] font-normal leading-[1.12] tracking-tight text-nurture-slate sm:mt-6 sm:leading-[1.1] lg:text-[3.35rem] lg:leading-[1.06]"
          >
            Learn, connect, and{" "}
            <em className="italic">prepare together</em>
          </h1>
          <p className="mt-5 font-sans text-base font-light leading-[1.7] text-nurture-charcoal/75 sm:mt-6 sm:text-lg sm:leading-[1.75] lg:mt-8 lg:text-xl lg:leading-[1.8]">
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

        <div className="relative z-0 mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none lg:-translate-x-[6%]">
          <div
            aria-hidden
            className="absolute inset-6 rounded-[2.75rem] bg-nurture-rose-light/45 blur-3xl"
          />
          <div className="relative px-2 py-3 sm:px-4 sm:py-4">
            <div className="hero-image-blend overflow-hidden rounded-3xl">
              <Image
                src={eventsHeroIllustrationSrc}
                alt={eventsHeroIllustrationAlt}
                width={1024}
                height={768}
                className="h-auto w-full object-cover object-center"
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

export default EventsHero;
