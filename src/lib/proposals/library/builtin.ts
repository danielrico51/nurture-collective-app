import type { ProposalLibraryEntry } from "@/types/proposal";

/** Built-in style references when S3 proposal-library is empty or unavailable. */
export const BUILTIN_PROPOSAL_LIBRARY: ProposalLibraryEntry[] = [
  {
    id: "postpartum-doula-standard",
    service_type: "postpartum-doula",
    title: "Postpartum doula support",
    tags: {
      service_types: ["postpartum-doula", "overnight-support"],
      budget_range: "mid",
      family_size: "first-baby",
      goals: ["recovery", "feeding", "sleep", "confidence"],
    },
    style_reference: {
      executive_summary:
        "A warm, structured postpartum support plan focused on recovery, feeding confidence, and sustainable routines for the first twelve weeks.",
      recommended_services: [
        {
          name: "Daytime postpartum doula",
          description: "Hands-on newborn care, feeding support, and parent rest.",
          frequency: "3 visits per week",
        },
        {
          name: "Overnight newborn care",
          description: "Nighttime feeding support and sleep guidance.",
          frequency: "2 nights per week",
        },
      ],
      timeline: "Weeks 1–12 postpartum with weekly check-ins.",
      pricing: "Packages from $X/week; custom quotes based on schedule.",
      next_steps: "Schedule onboarding call and confirm start date.",
    },
  },
  {
    id: "night-nurse-flex",
    service_type: "night-nurse",
    title: "Night nurse support",
    tags: {
      service_types: ["night-nurse", "newborn-care"],
      budget_range: "premium",
      family_size: "multiples",
      goals: ["sleep", "feeding", "parent-rest"],
    },
    style_reference: {
      executive_summary:
        "Overnight newborn care designed to protect parent sleep while maintaining safe feeding and soothing routines.",
      recommended_services: [
        {
          name: "Overnight newborn specialist",
          description: "11pm–7am in-home support with detailed morning handoff.",
          frequency: "5 nights per week",
        },
      ],
      timeline: "Flexible 4–12 week engagement with 2-week notice for changes.",
      pricing: "Nightly rate packages with volume discounts.",
      next_steps: "Confirm due date, home access, and pediatrician contact.",
    },
  },
  {
    id: "lactation-consult",
    service_type: "lactation-support",
    title: "Lactation consulting",
    tags: {
      service_types: ["lactation-support", "feeding"],
      budget_range: "entry",
      family_size: "any",
      goals: ["feeding", "confidence"],
    },
    style_reference: {
      executive_summary:
        "Evidence-based lactation support for establishing feeding, troubleshooting challenges, and building confidence.",
      recommended_services: [
        {
          name: "Prenatal lactation consult",
          description: "Preparation and expectations before baby arrives.",
        },
        {
          name: "Postpartum lactation visit",
          description: "Weighted feed assessment and personalized care plan.",
        },
      ],
      timeline: "Prenatal session at 36 weeks; postpartum visit within first 10 days.",
      pricing: "Single visits and bundled prenatal + postpartum packages.",
      next_steps: "Book prenatal session and share birth plan notes.",
    },
  },
];
