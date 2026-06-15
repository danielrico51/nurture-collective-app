import { brands } from "@/content/site";
import Link from "next/link";

interface EventQuestionsCtaProps {
  eventTitle: string;
}

const EventQuestionsCta = ({ eventTitle }: EventQuestionsCtaProps) => (
  <section className="mt-10 rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 p-6">
    <h2 className="font-serif text-xl font-semibold text-nurture-charcoal">
      Still have questions?
    </h2>
    <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/75">
      Our team is happy to talk through whether {eventTitle} is the right fit for
      you — registration, scheduling, payment, or anything else on your mind.
    </p>
    <div className="mt-5 flex flex-wrap gap-3">
      <a
        href={`tel:${brands.nestingPlace.localPhoneE164}`}
        className="inline-flex rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
      >
        Call {brands.nestingPlace.localPhone}
      </a>
      <Link
        href="/contact"
        className="inline-flex rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
      >
        Send a message
      </Link>
    </div>
  </section>
);

export default EventQuestionsCta;
