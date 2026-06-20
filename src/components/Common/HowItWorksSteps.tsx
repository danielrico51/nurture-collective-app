import SectionTitle from "@/components/Common/SectionTitle";
import SectionWaveEdges from "@/components/Common/SectionWaveEdges";

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
  organicWaves?: boolean;
  /** Fill for the top wave — match the section background above. */
  waveTopFill?: string;
  /** Fill for the bottom wave — match the section background below. */
  waveBottomFill?: string;
}

const NURTURE_CREAM = "#FAF7F2";
const WHITE = "#FFFFFF";

const STEP_ORGANIC_RADIUS = [
  "rounded-3xl md:rounded-[63%_37%_54%_46%/55%_48%_52%_45%]",
  "rounded-3xl md:rounded-[58%_42%_48%_52%/52%_44%_56%_48%]",
  "rounded-3xl md:rounded-[44%_56%_62%_38%/48%_56%_44%_52%]",
  "rounded-3xl md:rounded-[52%_48%_58%_42%/46%_54%_48%_56%]",
] as const;

const HowItWorksSteps = ({
  title,
  subtitle,
  steps,
  className = "",
  organicWaves = false,
  waveTopFill = NURTURE_CREAM,
  waveBottomFill = WHITE,
}: HowItWorksStepsProps) => {
  const sectionClassName = organicWaves
    ? `relative overflow-hidden pt-24 pb-24 sm:pt-28 sm:pb-28 ${className}`
    : className || "py-14 sm:py-16";

  return (
    <section className={sectionClassName}>
      {organicWaves && (
        <SectionWaveEdges topFill={waveTopFill} bottomFill={waveBottomFill} />
      )}
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} subtitle={subtitle} />
        <div
          className={`mt-10 grid gap-8 sm:grid-cols-2 ${
            steps.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
          }`}
        >
          {steps.map((item, index) => (
            <div
              key={item.step}
              className={`bg-[#FAF8F5] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:p-10 ${
                STEP_ORGANIC_RADIUS[index % STEP_ORGANIC_RADIUS.length]
              }`}
            >
              <span className="font-serif text-4xl font-semibold text-nurture-sage/40">
                {item.step}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold text-nurture-charcoal">
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
