import SectionTitle from "@/components/Common/SectionTitle";

const steps = [
  {
    step: "01",
    title: "Tell us your story",
    description:
      "Share where you are in your journey — expecting, recovering, or navigating new motherhood.",
  },
  {
    step: "02",
    title: "Meet your concierge",
    description:
      "We match you with a coordinator who understands your needs, schedule, and preferences.",
  },
  {
    step: "03",
    title: "Receive ongoing support",
    description:
      "From prenatal prep to postpartum care, we're beside you with practical and emotional help.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-nurture-sage/5 py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="How it works"
          subtitle="Simple steps to personalized care."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center md:text-left">
              <span className="font-serif text-4xl font-semibold text-nurture-sage/40">
                {item.step}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold">
                {item.title}
              </h3>
              <p className="mt-3 text-nurture-charcoal/70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
