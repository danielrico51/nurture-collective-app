import { buildCareStartHref } from "@/config/carePaths";
import Link from "next/link";
import LeafMark from "@/components/Art/LeafMark";

const HeartIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="currentColor">
    <path d="M10 17.5S2.5 12.2 2.5 7.5a3.6 3.6 0 0 1 6.3-2.5L10 6.2l1.2-1.2A3.6 3.6 0 0 1 17.5 7.5C17.5 12.2 10 17.5 10 17.5Z" />
  </svg>
);

const ServicesCtaBanner = () => (
  <section className="relative pb-16 sm:pb-20">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-nurture-sage/10 bg-gradient-to-r from-nurture-blush/70 via-nurture-rose-light/80 to-nurture-sage/20 px-6 py-6 text-center shadow-[0_14px_35px_rgba(45,52,54,0.07)] sm:flex-row sm:px-8 sm:text-left">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-nurture-sage-dark text-white shadow-sm">
            <LeafMark className="h-7 w-7 brightness-0 invert" />
          </div>
          <p className="max-w-xl font-serif text-xl font-semibold leading-snug text-nurture-charcoal sm:text-2xl">
            You&apos;re not just preparing for birth — you&apos;re becoming a
            parent.{" "}
            <span className="block text-base font-medium sm:text-lg">
              We&apos;re here to support you.
            </span>
          </p>
        </div>
        <Link
          href={buildCareStartHref()}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-nurture-rose px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-nurture-rose-dark"
        >
          <HeartIcon />
          Get Support Today
        </Link>
      </div>
    </div>
  </section>
);

export default ServicesCtaBanner;
