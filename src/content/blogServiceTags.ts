import type { ServiceSlug } from "@/content/site";

/** Default service tags for legacy blog posts (used when `serviceSlugs` is not stored on the post). */
export const BLOG_SERVICE_TAGS: Record<string, ServiceSlug[]> = {
  "why-prenatal-massage-and-wellness-matter-for-moms-to-be": ["prenatal-massage"],
  "how-a-birth-doula-supports-your-labor-a-gentle-guide-to-comfort-and-confidence":
    ["birth-doula"],
  "balancing-pregnancy-and-new-motherhood-with-a-demanding-career": [
    "birth-doula",
    "postpartum-care",
  ],
  "how-peer-support-can-help-you-thrive-through-pregnancy-and-new-motherhood": [
    "postpartum-care",
    "birth-doula",
  ],
  "how-does-the-nesting-place-support-and-empower-pregnant-and-postpartum-moms": [
    "birth-doula",
    "postpartum-care",
    "lactation",
    "prenatal-massage",
    "childbirth-education",
  ],
  "five-reasons-you-should-hire-a-doula": ["birth-doula", "postpartum-care"],
  "the-nesting-place-doula-new-jersey": ["birth-doula", "postpartum-care"],
  "the-importance-pregnancy-self-careand-beyond": [
    "postpartum-care",
    "prenatal-massage",
    "birth-doula",
  ],
  "understanding-c-sections-rates-vbac-and-how-to-lower-your-risk-in-new-york-and-new-jersey":
    ["birth-doula", "childbirth-education"],
  "lactation-consultant-breastfeeding-help-new-jersey": ["lactation", "postpartum-care"],
  "acupuncture-for-pregnancy-fertility": ["prenatal-massage"],
  "top-3-benefits-of-the-baby-s-choice-approach-to-feeding": [
    "postpartum-care",
    "lactation",
  ],
  "5-reasons-why-childbirth-education-is-the-class-to-take-in-2023": [
    "childbirth-education",
    "birth-doula",
  ],
  "practice-gratitude-and-nourish-your-soul-this-fall-season": [
    "prenatal-massage",
    "lactation",
    "postpartum-care",
  ],
  "new-year-new-baby-new-you-navigating-sex-after-baby": [
    "postpartum-care",
    "postpartum-massage",
  ],
  "how-are-pregnant-moms-connecting-with-each-other-in-the-age-of-covid-19": [
    "birth-doula",
  ],
  "expecting-more-from-your-postpartum-care-pelvic-floor-physical-therapy-during-pregnancy-and-after":
    ["postpartum-care", "prenatal-massage"],
};
