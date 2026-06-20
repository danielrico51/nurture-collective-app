interface SectionWaveEdgesProps {
  topFill?: string;
  bottomFill?: string;
  /** Render only the top wave (e.g. footer). */
  topOnly?: boolean;
  /** Render only the bottom wave. */
  bottomOnly?: boolean;
  /** Fade the top wave into the section below for a softer blend. */
  smoothTopFade?: boolean;
  /** Color that bleeds through the gradient tail (section background below the wave). */
  fadeThroughColor?: string;
}

const TOP_WAVE_PATH =
  "M0,0 L1200,0 L1200,88 C1085,58 965,108 820,72 C665,34 520,102 360,68 C220,42 95,96 0,62 L0,0 Z";

const BOTTOM_WAVE_PATH =
  "M0,120 L1200,120 L1200,32 C1070,62 910,8 760,48 C600,92 430,18 270,56 C150,82 55,28 0,58 L0,120 Z";

/**
 * Organic top/bottom wave dividers for section boundaries.
 * Place inside a `relative overflow-hidden` container.
 */
const SectionWaveEdges = ({
  topFill = "#FAF7F2",
  bottomFill = "#FFFFFF",
  topOnly = false,
  bottomOnly = false,
  smoothTopFade = false,
  fadeThroughColor = "#3A3348",
}: SectionWaveEdgesProps) => {
  const showTop = !bottomOnly;
  const showBottom = bottomOnly || (!topOnly && !bottomOnly);
  const topFillValue = smoothTopFade ? "url(#section-wave-top-fade)" : topFill;

  return (
    <>
      {showTop && (
        <svg
          className="pointer-events-none absolute left-0 top-0 z-[1] h-[5rem] w-full leading-[0] sm:h-[7rem]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {smoothTopFade && (
            <defs>
              <linearGradient
                id="section-wave-top-fade"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="0"
                y2="120"
              >
                <stop offset="0%" stopColor={topFill} stopOpacity="1" />
                <stop offset="32%" stopColor={topFill} stopOpacity="0.9" />
                <stop offset="58%" stopColor={topFill} stopOpacity="0.38" />
                <stop offset="78%" stopColor={fadeThroughColor} stopOpacity="0.22" />
                <stop offset="100%" stopColor={fadeThroughColor} stopOpacity="0" />
              </linearGradient>
            </defs>
          )}
          <path fill={topFillValue} d={TOP_WAVE_PATH} />
        </svg>
      )}
      {showBottom && (
        <svg
          className="pointer-events-none absolute bottom-0 left-0 z-[1] h-[5rem] w-full leading-[0] sm:h-[7rem]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill={bottomFill} d={BOTTOM_WAVE_PATH} />
        </svg>
      )}
    </>
  );
};

export default SectionWaveEdges;
