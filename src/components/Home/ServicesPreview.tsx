import Link from "next/link";
import SectionTitle from "@/components/Common/SectionTitle";

const services = [
  {
    title: "Prenatal planning",
    description:
      "Birth plans, nursery prep, and coordinating support before baby arrives.",
  },
  {
    title: "Postpartum recovery",
    description:
      "Meal coordination, rest planning, and hands-on help in those first weeks.",
  },
  {
    title: "Lactation & feeding",
    description:
      "Guidance and resources for breastfeeding, pumping, and feeding routines.",
  },
  {
    title: "Emotional wellness",
    description:
      "Check-ins, referrals, and space to process the fourth trimester.",
  },
];

const ServicesPreview = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="How we care for you"
          subtitle="Concierge support tailored to your family — not one-size-fits-all packages."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
            >
              <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                {service.title}
              </h3>
              <p className="mt-3 text-sm text-nurture-charcoal/70">
                {service.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            See all services →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;
