import Link from "next/link";
import Image from "next/image";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";

const Hero = () => {
  return (
    <section className="floating-header-offset relative overflow-hidden bg-gradient-to-b from-nurture-rose-light/50 via-nurture-blush/30 to-nurture-cream pb-16 sm:pb-20">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="relative z-10 text-left">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-nurture-sage-dark">
              {brands.nestingPlace.tagline}
            </p>
            <h1
              className="mt-4 font-serif text-[clamp(2rem,5vw+0.5rem,3.35rem)] font-normal leading-[1.12] tracking-tight text-nurture-slate sm:mt-6 sm:leading-[1.1] lg:text-[3.5rem] lg:leading-[1.06] xl:text-[3.75rem]"
            >
              Maternal support, coordinated for every stage of{" "}
              <em className="italic">motherhood</em>
            </h1>
            <p className="mt-5 font-sans text-base font-light leading-[1.7] text-nurture-charcoal/75 sm:mt-6 sm:text-lg sm:leading-[1.75] lg:mt-8 lg:text-xl lg:leading-[1.8]">
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
