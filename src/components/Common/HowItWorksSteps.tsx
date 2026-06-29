import SectionTitle from "@/components/Common/SectionTitle";
import SectionWaveEdges, {
  FOOTER_WAVE_OVERLAP_CLASS,
} from "@/components/Common/SectionWaveEdges";
import { MARKETING_CREAM } from "@/config/marketingDesign";

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
  /** When false, the top wave does not overlap the section above (avoids clipping titles/CTAs). */
  topOverlap?: boolean;
  /** Fill for the top wave — match the section background above. */
  waveTopFill?: string;
  /** Fill for the bottom wave — match the section background below. */
  waveBottomFill?: string;
}

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
  topOverlap = true,
  waveTopFill = MARKETING_CREAM,
  waveBottomFill = MARKETING_CREAM,
}: HowItWorksStepsProps) => {
  const sectionClassName = organicWaves
    ? [
        "relative overflow-hidden",
        topOverlap ? `z-[1] ${FOOTER_WAVE_OVERLAP_CLASS}` : "",
        topOverlap ? "pt-20 sm:pt-24" : "pt-24 sm:pt-28",
        "pb-24 sm:pb-28",
        className,
      ]
        .filter(Boolean)
        .join(" ")
    : className || "py-14 sm:py-16";

  return (
    <section className={sectionClassName}>
      {organicWaves && (
        <SectionWaveEdges topFill={waveTopFill} bottomFill={waveBottomFill} />
      )}
      <div className="relative z-[2] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} subtitle={subtitle} revealVariant="quick" />
        <div
          className={`mt-10 grid gap-8 sm:grid-cols-2 ${
            steps.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
          }`}
        >
          {steps.map((item, index) => (
            <div
              key={item.step}
              className={`how-it-works-step-card relative p-8 text-center lg:p-10 ${
                STEP_ORGANIC_RADIUS[index % STEP_ORGANIC_RADIUS.length]
              }`}
            >
              <span className="font-serif text-4xl font-semibold text-nurture-lilac">
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
