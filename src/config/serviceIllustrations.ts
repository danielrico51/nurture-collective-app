import type { ServiceSlug } from "@/content/site";

/** Brand illustration paths for each published service. */
export const serviceIllustrationSrc: Partial<Record<ServiceSlug, string>> = {
  "birth-doula": "/images/services/birth-doula.png",
  "overnight-newborn": "/images/services/overnight-newborn.png",
  "postpartum-care": "/images/services/postpartum-care.png",
  lactation: "/images/services/lactation.png?v=2",
  "prenatal-massage": "/images/services/prenatal-massage.png?v=2",
  "postpartum-massage": "/images/services/postpartum-massage.png?v=2",
  "childbirth-education": "/images/services/childbirth-education.png?v=2",
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
export const servicesHeroIllustrationSrc = "/images/services/main.png";

export const servicesHeroIllustrationAlt =
  "Parent seated peacefully with a swaddled newborn";
