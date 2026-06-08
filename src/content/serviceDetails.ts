import type { ServiceSlug } from "@/content/site";

export interface ServiceDetail {
  slug: ServiceSlug;
  whatToExpect: string[];
  /** URLs matching entries in `sourceCitations`. */
  sourceUrls: string[];
}

export const serviceDetails: ServiceDetail[] = [
  {
    slug: "birth-doula",
    whatToExpect: [
      "Prenatal visits to build your birth plan and comfort techniques",
      "Continuous support from early labor through your baby's first moments",
      "Emotional reassurance and advocacy with your care team",
    ],
    sourceUrls: [
      "https://ajph.aphapublications.org/doi/10.2105/AJPH.2024.307805",
      "https://www.ajog.org/article/S0002-9378(24)00869-X/fulltext",
      "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2019/02/approaches-to-limit-intervention-during-labor-and-birth",
      "https://www.naturalresources-sf.com/blogs/news/the-proven-benefits-of-birth-and-postpartum-doula-support-your-complete-guide",
    ],
  },
  {
    slug: "overnight-newborn",
    whatToExpect: [
      "Skilled overnight care for feeding, soothing, and diaper changes",
      "A rested parent who wakes up ready for the day ahead",
      "Flexible scheduling that fits your family's rhythm",
    ],
    sourceUrls: [
      "https://www.sleepmeeting.org/study-quantifies-sleep-loss-disruption-experienced-new-mothers/",
      "https://letmommysleep.com/blog/2025/10/20/the-truth-about-overnight-newborn-care-debunking-common-myths-about-night-doulas/",
      "https://harbor.co/blogs/blog/sleep-deprived-and-struggling-how-new-parents-sleep-loss-impacts-job-performance-and-retention",
      "https://www.joinphoenixhealth.com/resourcecenter/transitioning-back-to-work/",
    ],
  },
  {
    slug: "postpartum-care",
    whatToExpect: [
      "Hands-on recovery support and newborn care guidance",
      "Feeding help, emotional check-ins, and practical household support",
      "Care tailored through the fourth trimester and beyond",
    ],
    sourceUrls: [
      "https://www.thelancet.com/journals/eclinm/article/PIIS2589-5370(22)00261-9/fulltext",
      "https://www.ncbi.nlm.nih.gov/books/NBK592630/",
      "https://link.springer.com/article/10.1007/s00737-023-01350-z",
      "https://www.naturalresources-sf.com/blogs/news/the-proven-benefits-of-birth-and-postpartum-doula-support-your-complete-guide",
    ],
  },
  {
    slug: "lactation",
    whatToExpect: [
      "One-on-one assessment of latch, positioning, and milk transfer",
      "Personalized plans for breastfeeding, pumping, or combination feeding",
      "Follow-up support as your feeding goals evolve",
    ],
    sourceUrls: [
      "https://www.ncbi.nlm.nih.gov/books/NBK592630/",
      "https://www.thelancet.com/journals/eclinm/article/PIIS2589-5370(22)00261-9/fulltext",
    ],
  },
  {
    slug: "prenatal-massage",
    whatToExpect: [
      "Therapeutic bodywork designed for each stage of pregnancy",
      "Relief for back, hip, and shoulder tension as your body changes",
      "A calm, nurturing environment to rest and reconnect",
    ],
    sourceUrls: [],
  },
  {
    slug: "postpartum-massage",
    whatToExpect: [
      "Gentle therapeutic massage focused on postpartum recovery",
      "Relief for tension from feeding, carrying, and sleep disruption",
      "Time set aside to rest and heal in a supportive setting",
    ],
    sourceUrls: [
      "https://link.springer.com/article/10.1007/s00737-023-01350-z",
    ],
  },
  {
    slug: "childbirth-education",
    whatToExpect: [
      "Evidence-based classes on labor stages, comfort measures, and birth preferences",
      "Partner-inclusive preparation so your support team feels confident",
      "Practical newborn and early parenting guidance before baby arrives",
    ],
    sourceUrls: [
      "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2019/02/approaches-to-limit-intervention-during-labor-and-birth",
      "https://www.ajog.org/article/S0002-9378(24)00869-X/fulltext",
    ],
  },
];

const serviceDetailsBySlug = Object.fromEntries(
  serviceDetails.map((detail) => [detail.slug, detail])
) as Record<ServiceSlug, ServiceDetail>;

export const getServiceDetail = (slug: ServiceSlug): ServiceDetail | undefined =>
  serviceDetailsBySlug[slug];
