export interface ServiceStat {
  value: string;
  label: string;
}

export interface FeaturedServiceStats {
  slug: "birth-doula" | "overnight-newborn" | "postpartum-care";
  title: string;
  description: string;
  stats: ServiceStat[];
}

/** Homepage featured services with outcome stats (sources at /sources). */
export const featuredServiceStats: FeaturedServiceStats[] = [
  {
    slug: "birth-doula",
    title: "Birth doula support",
    description:
      "Continuous labor support from someone who knows you — helping you feel grounded, informed, and cared for through birth.",
    stats: [
      { value: "47%", label: "lower odds of Cesarean birth" },
      { value: "29%", label: "lower odds of preterm birth" },
      { value: "20%", label: "more likely to breastfeed exclusively" },
      { value: "41 min", label: "shorter average labor" },
    ],
  },
  {
    slug: "overnight-newborn",
    title: "Overnight newborn support",
    description:
      "Skilled overnight care for your newborn so you can rest, recover, and wake up ready for the day ahead.",
    stats: [
      { value: "3.2 hrs", label: "more uninterrupted sleep per night" },
      { value: "2–3 hrs", label: "saved per night for parents" },
      { value: "60%+", label: "of new parents get under 6 hours of sleep" },
      { value: "52%", label: "higher productivity with adequate rest" },
    ],
  },
  {
    slug: "postpartum-care",
    title: "Postpartum support for mom",
    description:
      "Hands-on recovery support, feeding guidance, and emotional care through the fourth trimester and beyond.",
    stats: [
      { value: "57.5%", label: "lower odds of postpartum depression or anxiety" },
      { value: "30%", label: "increase in breastfeeding initiation" },
      { value: "65%", label: "of maternal deaths occur postpartum" },
      { value: "13–19%", label: "of mothers experience postpartum depression" },
    ],
  },
];
