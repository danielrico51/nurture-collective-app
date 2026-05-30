export interface SourceCitation {
  label: string;
  publication: string;
  url: string;
}

export interface SourceSection {
  id: string;
  title: string;
  citations: SourceCitation[];
}

export const sourceSections: SourceSection[] = [
  {
    id: "birth-doula",
    title: "Birth doula support",
    citations: [
      {
        label: "47% lower C-section and 29% lower preterm birth",
        publication: "American Journal of Public Health, 2024",
        url: "https://ajph.aphapublications.org/doi/10.2105/AJPH.2024.307805",
      },
      {
        label: "20% more likely to breastfeed exclusively",
        publication: "American Journal of Obstetrics & Gynecology, 2024",
        url: "https://www.ajog.org/article/S0002-9378(24)00869-X/fulltext",
      },
      {
        label: "~41 min shorter labor (Cochrane Review, cited by ACOG)",
        publication: "ACOG Committee Opinion, 2019",
        url: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2019/02/approaches-to-limit-intervention-during-labor-and-birth",
      },
    ],
  },
  {
    id: "overnight-newborn",
    title: "Overnight newborn support",
    citations: [
      {
        label: "3.2 hrs uninterrupted sleep",
        publication: "Rush University / SLEEP Meeting, 2025",
        url: "https://www.sleepmeeting.org/study-quantifies-sleep-loss-disruption-experienced-new-mothers/",
      },
      {
        label: "2–3 hrs saved per night",
        publication: "Let Mommy Sleep, 2025",
        url: "https://letmommysleep.com/blog/2025/10/20/the-truth-about-overnight-newborn-care-debunking-common-myths-about-night-doulas/",
      },
      {
        label: "60%+ under 6 hrs sleep",
        publication: "Harbor Research, 2025",
        url: "https://harbor.co/blogs/blog/sleep-deprived-and-struggling-how-new-parents-sleep-loss-impacts-job-performance-and-retention",
      },
      {
        label: "52% higher productivity, 64% fewer errors",
        publication: "NIOSH data, cited in Phoenix Health, 2026",
        url: "https://www.joinphoenixhealth.com/resourcecenter/transitioning-back-to-work/",
      },
    ],
  },
  {
    id: "postpartum-care",
    title: "Postpartum support for mom",
    citations: [
      {
        label: "57.5% lower PPD/PPA odds",
        publication: "The Lancet / eClinicalMedicine, 2022",
        url: "https://www.thelancet.com/journals/eclinm/article/PIIS2589-5370(22)00261-9/fulltext",
      },
      {
        label: "30% increase in breastfeeding initiation",
        publication: "Natural Resources evidence review, 2025",
        url: "https://www.naturalresources-sf.com/blogs/news/the-proven-benefits-of-birth-and-postpartum-doula-support-your-complete-guide",
      },
      {
        label: "65% of maternal deaths postpartum",
        publication: "NCBI / Postpartum Care Systematic Review",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK592630/",
      },
      {
        label: "13–19% PPD, 44% among Black mothers",
        publication: "Archives of Women's Mental Health, 2023 + NIH Report, 2023",
        url: "https://link.springer.com/article/10.1007/s00737-023-01350-z",
      },
    ],
  },
];
