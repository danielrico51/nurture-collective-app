import { buildCareStartHref } from "@/config/carePaths";
import Link from "next/link";

const ServicesCtaBanner = () => (
  <section className="pb-10 sm:pb-12">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div
        className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2rem] border border-nurture-sage/15 bg-gradient-to-r from-nurture-blush/50 via-nurture-rose-light/60 to-nurture-sage/15 px-6 py-8 text-center shadow-[0_14px_35px_rgba(45,52,54,0.06)] sm:flex-row sm:px-8 sm:py-7 sm:text-left"
      >
        <p className="max-w-xl font-serif text-xl font-semibold leading-snug text-nurture-charcoal sm:text-2xl">
          You&apos;re not just preparing for birth — you&apos;re becoming a
          parent.{" "}
          <span className="block text-base font-medium text-nurture-charcoal/75 sm:text-lg">
            We&apos;re here to support you.
          </span>
        </p>
        <Link
          href={buildCareStartHref()}
          className="btn-primary-lg shrink-0"
        >
          Request support
        </Link>
      </div>
    </div>
  </section>
);

export default ServicesCtaBanner;
