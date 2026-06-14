import ServicesDecor from "@/components/Services/ServicesDecor";
import { buildCareStartHref } from "@/config/carePaths";
import {
  servicesHeroIllustrationAlt,
  servicesHeroIllustrationSrc,
} from "@/config/serviceIllustrations";
import { servicesPageDecor } from "@/config/servicesDecor";
import { brands } from "@/content/site";
import Image from "next/image";
import Link from "next/link";

const HeartIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="currentColor">
    <path d="M10 17.5S2.5 12.2 2.5 7.5a3.6 3.6 0 0 1 6.3-2.5L10 6.2l1.2-1.2A3.6 3.6 0 0 1 17.5 7.5C17.5 12.2 10 17.5 10 17.5Z" />
  </svg>
);

const ServicesHero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-nurture-rose-light/60 via-nurture-cream to-nurture-blush/40 pb-16 pt-10 sm:pb-20 sm:pt-14">
    <ServicesDecor src={servicesPageDecor.heroWash} placement="hero-wash" />
    <ServicesDecor src={servicesPageDecor.cornerBottomLeft} placement="corner-bottom-left" />

    <div className="relative z-[1] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Image
              src={brands.nestingPlace.markSrc}
              alt=""
              aria-hidden
              width={56}
              height={56}
              className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            />
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              {brands.nestingPlace.byline}
            </p>
          </div>
          <ServicesDecor
            src={servicesPageDecor.headingOrnament}
            placement="heading-ornament"
          />
          <h1 className="font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:text-5xl lg:text-[3.35rem]">
            Every Step of Your Maternity Journey
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-nurture-charcoal/75">
            Evidence-based support, nurturing care, and expert guidance for you
            and your growing family — from pregnancy through the fourth
            trimester.
          </p>
          <Link
            href={buildCareStartHref()}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-nurture-rose px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nurture-rose-dark"
          >
            <HeartIcon />
            Get Support Today
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-[2rem] border border-nurture-sage/20 bg-white/95 p-3 shadow-lg shadow-nurture-sage/10 sm:p-5">
            <Image
              src={servicesHeroIllustrationSrc}
              alt={servicesHeroIllustrationAlt}
              width={1024}
              height={768}
              className="h-auto w-full rounded-[1.35rem] object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ServicesHero;
