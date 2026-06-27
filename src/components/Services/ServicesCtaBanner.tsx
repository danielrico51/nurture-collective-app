import { buildCareStartHref } from "@/config/carePaths";
import { marketingCtaBanner } from "@/config/marketingDesign";
import Link from "next/link";

const ServicesCtaBanner = () => (
  <section className="pb-10 sm:pb-12">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className={marketingCtaBanner}>
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
