import Link from "next/link";
import { marketingCtaBanner } from "@/config/marketingDesign";

const EventsCtaBanner = () => (
  <section className="pb-10 sm:pb-12">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className={marketingCtaBanner}>
        <p className="max-w-xl font-serif text-xl font-semibold leading-snug text-nurture-charcoal sm:text-2xl">
          Don&apos;t see the session you need?{" "}
          <span className="block text-base font-medium text-nurture-charcoal/75 sm:text-lg">
            We&apos;re adding classes and events regularly — reach out and we&apos;ll
            help you find a fit.
          </span>
        </p>
        <Link href="/contact" className="btn-primary-lg shrink-0 shadow-sm">
          Contact us
        </Link>
      </div>
    </div>
  </section>
);

export default EventsCtaBanner;
