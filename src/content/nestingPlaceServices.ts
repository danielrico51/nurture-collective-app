/** The Nesting Place — active in-person service offerings (concierge priority). */
export const NESTING_PLACE_SERVICE_AREA =
  "Northern New Jersey, Lower Hudson Valley, and surrounding areas";

export const NESTING_PLACE_PRACTICE_SUMMARY =
  "The Nesting Place is a maternal wellness and postpartum support practice serving families throughout Northern New Jersey, the Lower Hudson Valley, and surrounding areas. We provide experienced, evidence-based birth doula support, overnight newborn care, postpartum support, lactation support, and prenatal massage to help families feel confident and supported during pregnancy, labor, and the early weeks at home with their newborn.";

/** Services the concierge should prioritize recommending and discussing. */
export const NESTING_PLACE_CORE_OFFERINGS = [
  {
    id: "birth-doula",
    label: "Birth doula support",
    description: "Experienced, evidence-based labor and birth support",
  },
  {
    id: "overnight-newborn-care",
    label: "Overnight newborn care",
    description: "Nighttime newborn care so parents can rest and recover",
  },
  {
    id: "postpartum-doula",
    label: "Postpartum care",
    description: "Hands-on recovery and newborn support in the early weeks at home",
  },
  {
    id: "lactation",
    label: "Lactation support",
    description: "Breastfeeding and feeding guidance from experienced specialists",
  },
  {
    id: "prenatal-massage",
    label: "Prenatal massage",
    description: "Therapeutic massage during pregnancy for comfort and wellness",
  },
] as const;

export const NESTING_PLACE_OFFERINGS_PROMPT = NESTING_PLACE_CORE_OFFERINGS.map(
  (service) => `- ${service.label}: ${service.description}`
).join("\n");

export const NESTING_PLACE_CONCIERGE_QUICK_REPLIES = [
  "Birth doula support",
  "Overnight newborn care",
  "Postpartum care",
  "Lactation support",
  "Prenatal massage",
  "Not sure yet — help me choose",
];
