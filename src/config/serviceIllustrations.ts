import type { ServiceSlug } from "@/content/site";

/** Brand illustration paths for each published service (2026 refresh). */
export const serviceIllustrationSrc: Partial<Record<ServiceSlug, string>> = {
  "birth-doula": "/images/services/birth-doula.jpg",
  "overnight-newborn": "/images/services/overnight-newborn.jpg",
  "postpartum-care": "/images/services/postpartum-care.jpg",
  lactation: "/images/services/lactation.jpg",
  "prenatal-massage": "/images/services/prenatal-massage.jpg",
  "postpartum-massage": "/images/services/postpartum-massage.jpg",
  "childbirth-education": "/images/services/childbirth-education.jpg",
};

export const serviceIllustrationAlt: Partial<Record<ServiceSlug, string>> = {
  "birth-doula": "Doula supporting a pregnant woman on a birth ball",
  "overnight-newborn": "Nighttime newborn care while a parent rests",
  "postpartum-care": "Parents caring for their newborn together at home",
  lactation: "Lactation consultant supporting a breastfeeding parent",
  "prenatal-massage": "Prenatal massage with side-lying support",
  "postpartum-massage": "Postpartum massage on a treatment table",
  "childbirth-education": "Childbirth education class with instructor and expectant parents",
};

/** Hero art for the services landing page. */
export const servicesHeroIllustrationSrc = "/images/services/main.jpg";

export const servicesHeroIllustrationAlt =
  "Parent seated peacefully with a swaddled newborn";
