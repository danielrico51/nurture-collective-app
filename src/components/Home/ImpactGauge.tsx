import SlotNumber, { type SlotNumberVariant } from "@/components/Home/SlotNumber";
import type { SlotStatPoint } from "@/content/serviceStats";

interface ImpactGaugeProps {
  point: SlotStatPoint;
  variant?: SlotNumberVariant;
}

const gaugeFillRatio = (point: SlotStatPoint): number => {
  if (point.suffix === "%") return Math.min(point.value / 100, 1);
  if (point.suffix?.includes("hour")) return Math.min(point.value / 8, 1);
  return Math.min(point.value / 60, 1);
};

const GAUGE_TRACK = "#C4B5A4";
const GAUGE_FILL: Record<SlotNumberVariant, string> = {
  sage: "#4A4559",
  lilac: "#8B7AA8",
};

const ImpactGauge = ({ point, variant = "sage" }: ImpactGaugeProps) => {
  const radius = 48;
  const arcLength = Math.PI * radius;
  const filled = arcLength * gaugeFillRatio(point);
  const fillColor = GAUGE_FILL[variant];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 120 72"
        className="h-28 w-44"
        aria-hidden
      >
        <path
          d="M 12 60 A 48 48 0 0 1 108 60"
          fill="none"
          stroke={GAUGE_TRACK}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 12 60 A 48 48 0 0 1 108 60"
          fill="none"
          stroke={fillColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLength}`}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <p className="text-center font-serif text-2xl font-semibold text-nurture-charcoal">
        <SlotNumber
          target={point.value}
          prefix={point.prefix}
          suffix={point.suffix}
          variant={variant}
        />
      </p>
      <p className="max-w-xs text-center text-sm leading-relaxed text-nurture-charcoal/70">
        {point.label}
      </p>
    </div>
  );
};

export default ImpactGauge;
