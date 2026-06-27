import SlotNumber, { type SlotNumberVariant } from "@/components/Home/SlotNumber";
import {
  isSlotStatPoint,
  type SlotStatPoint,
} from "@/content/serviceStats";

interface ServiceStatsPointListProps {
  slug: string;
  points: readonly (string | SlotStatPoint)[];
}

const SLOT_VARIANT_BY_SLUG: Record<string, SlotNumberVariant> = {
  "birth-doula": "sage",
  "overnight-newborn": "lilac",
  "postpartum-care": "sage",
};

const ServiceStatsPointList = ({ slug, points }: ServiceStatsPointListProps) => {
  const slotVariant = SLOT_VARIANT_BY_SLUG[slug] ?? "sage";

  return (
    <ul
      className="space-y-3 rounded-2xl border border-nurture-lilac/25 bg-nurture-cream p-5 shadow-sm sm:p-6"
    >
      {points.map((point) => (
        <li
          key={`${slug}-${isSlotStatPoint(point) ? point.label : point}`}
          className="flex gap-3 text-base leading-relaxed text-nurture-charcoal/80"
        >
          <span
            aria-hidden
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-lilac"
          />
          <span>
            {isSlotStatPoint(point) ? (
              <>
                <SlotNumber
                  target={point.value}
                  prefix={point.prefix}
                  suffix={point.suffix}
                  variant={slotVariant}
                />
                {" "}
                {point.label}
              </>
            ) : (
              point
            )}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ServiceStatsPointList;
