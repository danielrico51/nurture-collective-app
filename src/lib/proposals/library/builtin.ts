import type { ProposalLibraryEntry } from "@/types/proposal";

/** Built-in style references when S3 proposal-library is empty or unavailable. */
export const BUILTIN_PROPOSAL_LIBRARY: ProposalLibraryEntry[] = [
  {
    id: "postpartum-doula-standard",
    service_type: "postpartum-doula",
    title: "Postpartum doula support agreement",
    tags: {
      service_types: ["postpartum-doula", "overnight-support"],
      budget_range: "mid",
      family_size: "first-baby",
      goals: ["recovery", "feeding", "sleep", "confidence"],
    },
    document_structure: {
      document_title: "POSTPARTUM DOULA SERVICES AGREEMENT",
      section_headings: [
        "Parties and Purpose",
        "Scope of Services",
        "Schedule",
        "Fees and Payment",
        "Terms and Limitations",
        "Next Steps"
      ],
      tone: "Formal postpartum service agreement with enumerated shifts and payment schedule.",
      payment_pattern: "Weekly or package rate with deposit and balance milestones.",
    },
    style_reference: {
      executive_summary:
        "This Postpartum Doula Services Agreement is between The Nesting Place, LLC and the Client for structured postpartum support during the first twelve weeks after birth.",
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
      timeline: "Weeks 1–12 postpartum with weekly check-ins and 48-hour scheduling notice.",
      pricing:
        "Package rate based on weekly schedule; deposit due at signing, balance in installments.",
      terms:
        "Non-medical support only. Minimum session lengths apply. 48-hour notice for schedule changes.",
      next_steps: "Sign agreement, submit deposit, and schedule onboarding call to confirm start date.",
    },
  },
  {
    id: "night-nurse-flex",
    service_type: "night-nurse",
    title: "Overnight newborn specialist agreement",
    tags: {
      service_types: ["night-nurse", "newborn-care"],
      budget_range: "premium",
      family_size: "multiples",
      goals: ["sleep", "feeding", "parent-rest"],
    },
    document_structure: {
      document_title: "OVERNIGHT NEWBORN CARE AGREEMENT",
      section_headings: [
        "Parties and Purpose",
        "Scope of Services",
        "Schedule",
        "Fees and Payment",
        "Terms",
        "Next Steps"
      ],
      tone: "Overnight care contract with shift hours and handoff expectations.",
      payment_pattern: "Nightly or weekly package with non-refundable deposit.",
    },
    style_reference: {
      executive_summary:
        "This Overnight Newborn Care Agreement is between The Nesting Place, LLC and the Client for in-home overnight newborn specialist support.",
      recommended_services: [
        {
          name: "Overnight newborn specialist",
          description: "11pm–7am in-home support with detailed morning handoff.",
          frequency: "5 nights per week",
        },
      ],
      timeline: "Flexible 4–12 week engagement with 2-week notice for changes.",
      pricing: "Nightly rate packages with volume discounts; deposit at signing.",
      terms:
        "Specialist provides non-medical newborn care. Safe sleep practices required. Client provides access and supplies.",
      next_steps: "Confirm due date, home access, and pediatrician contact before first shift.",
    },
  },
  {
    id: "lactation-consult",
    service_type: "lactation-support",
    title: "Lactation consulting services agreement",
    tags: {
      service_types: ["lactation-support", "feeding"],
      budget_range: "entry",
      family_size: "any",
      goals: ["feeding", "confidence"],
    },
    document_structure: {
      document_title: "LACTATION CONSULTING SERVICES AGREEMENT",
      section_headings: [
        "Parties and Purpose",
        "Scope of Services",
        "Fees and Payment",
        "Terms",
        "Next Steps"
      ],
      tone: "Professional lactation services agreement with visit-based scope.",
      payment_pattern: "Per-visit or bundled package fees due at booking.",
    },
    style_reference: {
      executive_summary:
        "This Lactation Consulting Services Agreement is between The Nesting Place, LLC and the Client for evidence-based feeding support.",
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
      terms:
        "Lactation consultants do not prescribe medication or replace pediatric or OB care. Referrals provided when clinical issues arise.",
      next_steps: "Book prenatal session and share birth plan notes.",
    },
  },
];
