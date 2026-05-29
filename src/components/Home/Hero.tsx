import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import Link from "next/link";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nurture-blush/30 to-nurture-cream pb-20 pt-6 sm:pt-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <NestingPlaceLogo
            variant="hero"
            priority
            linked={false}
            className="mx-auto"
          />
          <p className="mt-3 text-sm font-medium tracking-wide text-nurture-charcoal/60">
            {brands.nestingPlace.byline}
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
            {brands.nestingPlace.tagline}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:text-5xl lg:text-6xl">
            Maternal support, coordinated for every stage of motherhood
          </h1>
          <p className="mt-6 text-lg text-nurture-charcoal/80 sm:text-xl">
            {brands.nestingPlace.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={buildCareStartHref()}
              className="rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-nurture-sage-dark"
            >
              Request support
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-nurture-sage px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              View services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
