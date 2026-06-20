import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import { MARKETING_CREAM } from "@/config/marketingDesign";

type MarketingWaveMode = "none" | "top" | "bottom" | "both";

interface MarketingSectionProps {
  children: React.ReactNode;
  className?: string;
  waves?: MarketingWaveMode;
  waveTopFill?: string;
  waveBottomFill?: string;
  smoothTopFade?: boolean;
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
  id,
}: MarketingSectionProps) => {
  const showTop = waves === "top" || waves === "both";
  const showBottom = waves === "bottom" || waves === "both";

  return (
    <section
      id={id}
      className={`relative overflow-hidden ${wavePadding[waves]} ${className}`}
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
      <div className="relative">{children}</div>
    </section>
  );
};

export default MarketingSection;
