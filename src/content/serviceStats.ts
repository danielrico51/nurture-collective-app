export interface FeaturedServiceStats {
  slug: "birth-doula" | "overnight-newborn" | "postpartum-care";
  title: string;
  description: string;
  points: string[];
}

/** Homepage featured services with outcome stats (sources at /sources). */
export const featuredServiceStats: FeaturedServiceStats[] = [
  {
    slug: "birth-doula",
    title: "Birth Doula Support",
    description:
      "Continuous labor support from someone who knows you — helping you feel grounded, informed, and cared for through birth.",
    points: [
      "~41 minutes shorter average labor duration with continuous support",
      "47% lower risk of cesarean delivery",
      "116% more likely to achieve a successful vaginal birth after a previous cesarean",
    ],
  },
  {
    slug: "overnight-newborn",
    title: "Overnight Newborn Support",
    description:
      "Skilled overnight care for your newborn so you can rest, recover, and wake up ready for the day ahead.",
    points: [
      "3.2 hours is the average uninterrupted sleep new moms get in weeks 2–7",
      "2–3 hours of additional sleep per night for the breastfeeding parent, because the night doula handles all diaper changes, soothing, and bottle prep",
      "52% higher workplace productivity among new mothers who got adequate sleep in the first 6 months postpartum",
    ],
  },
  {
    slug: "postpartum-care",
    title: "Postpartum Support for Mom",
    description:
      "Hands-on recovery support, feeding guidance, and emotional care through the fourth trimester and beyond.",
    points: [
      "13–19% of new mothers are diagnosed with postpartum depression — reaching 44% among Black mothers",
      "57.5% lower odds of postpartum depression or anxiety, rising to 64.7% when doula support spans through the fourth trimester",
      "30% increase in breastfeeding initiation with postpartum doula support",
    ],
  },
];
