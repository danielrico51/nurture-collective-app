export interface SlotStatPoint {
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
}

export function isSlotStatPoint(
  point: string | SlotStatPoint,
): point is SlotStatPoint {
  return typeof point !== "string";
}

export function statPointToString(point: string | SlotStatPoint): string {
  if (typeof point === "string") return point;
  const prefix = point.prefix ?? "";
  const suffix = point.suffix ?? "";
  return `${prefix}${point.value}${suffix} ${point.label}`;
}

export interface FeaturedServiceStats {
  slug: "birth-doula" | "overnight-newborn" | "postpartum-care";
  title: string;
  description: string;
  points: (string | SlotStatPoint)[];
}

/** Homepage featured services with outcome stats (sources at /sources). */
export const featuredServiceStats: FeaturedServiceStats[] = [
  {
    slug: "birth-doula",
    title: "Birth Doula Support",
    description:
      "Continuous labor support from someone who knows you — helping you feel grounded, informed, and cared for through birth.",
    points: [
      {
        prefix: "~",
        value: 41,
        label: "minutes shorter average labor duration with continuous support",
      },
      {
        value: 47,
        suffix: "%",
        label: "lower risk of cesarean delivery",
      },
      {
        value: 116,
        suffix: "%",
        label:
          "more likely to achieve a successful vaginal birth after a previous cesarean",
      },
    ],
  },
  {
    slug: "overnight-newborn",
    title: "Overnight Newborn Support",
    description:
      "Skilled overnight care for your newborn so you can rest, recover, and wake up ready for the day ahead.",
    points: [
      {
        value: 3.2,
        suffix: " hours",
        label: "is the average uninterrupted sleep new moms get in weeks 2–7",
      },
      {
        prefix: "2–",
        value: 3,
        suffix: " hours",
        label:
          "of additional sleep per night for the breastfeeding parent, because the night doula handles all diaper changes, soothing, and bottle prep",
      },
      {
        value: 52,
        suffix: "%",
        label:
          "higher workplace productivity among new mothers who got adequate sleep in the first 6 months postpartum",
      },
    ],
  },
  {
    slug: "postpartum-care",
    title: "Postpartum Support for Mom",
    description:
      "Hands-on recovery support, feeding guidance, and emotional care through the fourth trimester and beyond.",
    points: [
      {
        prefix: "13–",
        value: 19,
        suffix: "%",
        label:
          "of new mothers are diagnosed with postpartum depression — reaching 44% among Black mothers",
      },
      {
        value: 57.5,
        suffix: "%",
        label:
          "lower odds of postpartum depression or anxiety, rising to 64.7% when doula support spans through the fourth trimester",
      },
      {
        value: 30,
        suffix: "%",
        label: "increase in breastfeeding initiation with postpartum doula support",
      },
    ],
  },
];
