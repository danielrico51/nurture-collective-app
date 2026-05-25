import SectionTitle from "@/components/Common/SectionTitle";

interface Step {
  step: string;
  title: string;
  description: string;
}

interface HowItWorksStepsProps {
  title: string;
  subtitle?: string;
  steps: readonly Step[];
  className?: string;
}

const HowItWorksSteps = ({
  title,
  subtitle,
  steps,
  className = "py-20",
}: HowItWorksStepsProps) => {
  return (
    <section className={className}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} subtitle={subtitle} />
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

export default HowItWorksSteps;
