import { futureConciergeServices } from "@/content/site";
import SectionTitle from "@/components/Common/SectionTitle";
import Link from "next/link";

const ConciergeVision = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="The concierge platform we're building"
          subtitle="Nurture Collective is becoming the AI-powered marketplace that coordinates every service a mom needs — not just pre- and postpartum, in every region we expand to."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {futureConciergeServices.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-dashed border-nurture-sage/30 bg-nurture-cream/40 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark/70">
                Coming soon
              </p>
              <h3 className="mt-2 font-serif text-lg font-semibold text-nurture-charcoal">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-nurture-charcoal/65">
                {service.description}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-nurture-charcoal/60">
          Today, start with maternal wellness in{" "}
          <Link href="/for-moms#coverage" className="font-medium text-nurture-sage-dark hover:underline">
            our active regions
          </Link>
          . Tomorrow, one concierge for everything motherhood requires — nationwide.
        </p>
      </div>
    </section>
  );
};

export default ConciergeVision;
