import Link from "next/link";
import { marketingCtaBanner } from "@/config/marketingDesign";

const EventsCtaBanner = () => (
  <div className="mx-auto max-w-4xl">
    <div className={`relative z-[1] ${marketingCtaBanner}`}>
      <p className="relative z-[1] max-w-xl font-serif text-xl font-semibold leading-snug text-nurture-charcoal sm:text-2xl">
        Don&apos;t see the session you need?{" "}
        <span className="block text-base font-medium text-nurture-charcoal/75 sm:text-lg">
          We&apos;re adding classes and events regularly — reach out and we&apos;ll
          help you find a fit.
        </span>
      </p>
      <Link href="/contact" className="btn-primary-lg relative z-[1] shrink-0 shadow-sm">
        Contact us
      </Link>
    </div>
  </div>
);

export default EventsCtaBanner;
