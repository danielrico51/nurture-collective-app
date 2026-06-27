import SectionWaveEdges, {
  FOOTER_SECTION_CLASS,
  SECTION_WAVE_TOP_OVERLAP_CLASS,
} from "@/components/Common/SectionWaveEdges";
import { MARKETING_CREAM } from "@/config/marketingDesign";

type MarketingWaveMode = "none" | "top" | "bottom" | "both";

interface MarketingSectionProps {
  children: React.ReactNode;
  className?: string;
  waves?: MarketingWaveMode;
  waveTopFill?: string;
  waveBottomFill?: string;
  smoothTopFade?: boolean;
  /** Reserve space above the footer wave so content is not covered. */
  footerClearance?: boolean;
  id?: string;
}

const wavePadding: Record<MarketingWaveMode, string> = {
  none: "",
  top: "pt-20 sm:pt-24",
  bottom: "pb-20 sm:pb-24",
  both: "pt-20 pb-20 sm:pt-24 sm:pb-24",
};

const MarketingSection = ({
  children,
  className = "",
  waves = "none",
  waveTopFill = MARKETING_CREAM,
  waveBottomFill = MARKETING_CREAM,
  smoothTopFade = false,
  footerClearance = false,
  id,
}: MarketingSectionProps) => {
  const showTop = waves === "top" || waves === "both";
  const showBottom =
    (waves === "bottom" || waves === "both") && !footerClearance;

  const paddingClass = footerClearance
    ? [showTop ? "pt-20 sm:pt-24" : ""].filter(Boolean).join(" ")
    : wavePadding[waves];

  const topOverlapClass =
    showTop && !footerClearance ? SECTION_WAVE_TOP_OVERLAP_CLASS : "";

  const sectionClass = footerClearance
    ? `${FOOTER_SECTION_CLASS} ${paddingClass} ${className}`.trim()
    : `relative overflow-hidden ${topOverlapClass} ${paddingClass} ${className}`.trim();

  return (
    <section
      id={id}
      className={sectionClass}
    >
      {showTop && (
        <SectionWaveEdges
          topOnly
          smoothTopFade={smoothTopFade}
          topFill={waveTopFill}
          fadeThroughColor={waveBottomFill}
        />
      )}
      {showBottom && (
        <SectionWaveEdges
          bottomOnly
          bottomFill={waveBottomFill}
        />
      )}
      <div className="relative z-[2]">{children}</div>
    </section>
  );
};

export default MarketingSection;
