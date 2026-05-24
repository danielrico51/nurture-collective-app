import Link from "next/link";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nurture-blush/30 to-nurture-cream pb-20 pt-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
            Pre & postpartum concierge
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:text-5xl lg:text-6xl">
            Support for every stage of motherhood
          </h1>
          <p className="mt-6 text-lg text-nurture-charcoal/80 sm:text-xl">
            The Nurture Collective is your personal concierge for pregnancy,
            birth recovery, and life with a newborn — practical help, emotional
            care, and guidance when you need it most.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {PUBLIC_SIGNUP_ENABLED ? (
              <Link
                href="/signup"
                className="rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-nurture-sage-dark"
              >
                Join the collective
              </Link>
            ) : (
              <Link
                href="/signin"
                className="rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-nurture-sage-dark"
              >
                Sign in
              </Link>
            )}
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
