import BotanicalAccent from "@/components/Art/BotanicalAccent";
import Link from "next/link";
import Image from "next/image";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const heroDescription =
  "An experienced maternal wellness and postpartum support practice offering birth doula support, overnight newborn care, postpartum support, lactation support, and prenatal massage — with real people guiding you from your first call through every stage of motherhood.";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nurture-rose-light/50 via-nurture-blush/30 to-nurture-cream pb-16 pt-8 sm:pb-20 sm:pt-10">
      <BotanicalAccent position="top-right" variant="leaf" className="opacity-30" />
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
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
            <div
              aria-hidden
              className="absolute inset-6 rounded-[2.75rem] bg-nurture-rose-light/50 blur-3xl"
            />
            <div className="relative px-2 py-3 sm:px-4 sm:py-4">
              <div className="hero-image-blend overflow-hidden">
                <Image
                  src="/images/hero-home.jpg"
                  alt="Two caregivers gently supporting a newborn baby together in a bright, welcoming home"
                  width={1024}
                  height={681}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2 bg-gradient-to-r from-nurture-rose-light/50 via-transparent to-nurture-rose-light/40 sm:inset-4"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2 bg-gradient-to-b from-nurture-rose-light/35 via-transparent to-nurture-cream/55 sm:inset-4"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
