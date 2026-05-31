import Link from "next/link";
import Image from "next/image";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const heroDescription =
  "An experienced maternal wellness and postpartum support practice offering birth doula support, overnight newborn care, postpartum support, lactation support, and prenatal massage — with real people guiding you from your first call through every stage of motherhood.";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nurture-blush/30 to-nurture-cream pb-16 pt-8 sm:pb-20 sm:pt-10">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              {brands.nestingPlace.tagline}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Maternal support, coordinated for every stage of motherhood
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-nurture-charcoal/80 sm:text-xl">
              {heroDescription}
            </p>
            <div className="mt-8">
              <Link
                href={buildCareStartHref()}
                className="inline-flex justify-center rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-nurture-sage-dark"
              >
                Request support
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="overflow-hidden rounded-[2rem] border border-nurture-sage/15 bg-nurture-cream shadow-lg shadow-nurture-sage/10">
              <Image
                src="/images/hero-maternal-team.jpg"
                alt="Three women sharing ultrasound photos together on a couch"
                width={1200}
                height={900}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
