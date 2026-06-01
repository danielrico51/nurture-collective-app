import { careCoordinator, futureConciergeServices } from "@/content/site";
import SectionTitle from "@/components/Common/SectionTitle";

const ConciergeVision = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={`The ${careCoordinator.platform} we're building`}
          subtitle={`${careCoordinator.full}s who know you by name — coordinating every service a mom needs, not just pre- and postpartum.`}
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
          Today, start with Maternal Wellness support from The Nesting Place.
          Tomorrow, one {careCoordinator.short.toLowerCase()} for everything
          motherhood requires — with a real person guiding you every step of the
          way.
        </p>
      </div>
    </section>
  );
};

export default ConciergeVision;
