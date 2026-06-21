import type { ServiceSlug } from "@/content/site";

const base = "/images/services/decor";

/** Decorative SVG assets for the services landing page. */
export const servicesPageDecor = {
  heroWash: `${base}/hero-wash.svg`,
  cornerTopRight: `${base}/corner-top-right.svg`,
  cornerBottomLeft: `${base}/corner-bottom-left.svg`,
  cornerBottomRight: `${base}/corner-bottom-right.svg`,
  sectionDivider: `${base}/section-divider.svg`,
  edgeLeft: `${base}/edge-left.svg`,
  edgeRight: `${base}/edge-right.svg`,
  patternTile: `${base}/pattern-tile.svg`,
  headingOrnament: `${base}/heading-ornament.svg`,
  ctaWash: `${base}/cta-wash.svg`,
  ctaWave: `${base}/cta-wave.svg`,
  ctaHeart: `${base}/cta-heart.svg`,
} as const;

/** Soft wash behind each service card (`01_service_card_background_*`). */
export const serviceCardBackgroundSrc: Partial<Record<ServiceSlug, string>> = {
  "birth-doula": `${base}/card-background-1.svg`,
  "overnight-newborn": `${base}/card-background-2.svg`,
  "postpartum-care": `${base}/card-background-3.svg`,
  lactation: `${base}/card-background-4.svg`,
  "prenatal-massage": `${base}/card-background-5.svg`,
  "postpartum-massage": `${base}/card-background-6.svg`,
  "childbirth-education": `${base}/card-background-7.svg`,
  "placenta-encapsulation": `${base}/card-background-3.svg`,
};

/** Botanical corner frame per card (`21_package_card_corner_frame_*`). */
export const serviceCardCornerSrc: Partial<Record<ServiceSlug, string>> = {
  "birth-doula": `${base}/card-corner-1.svg`,
  "overnight-newborn": `${base}/card-corner-2.svg`,
  "postpartum-care": `${base}/card-corner-3.svg`,
  lactation: `${base}/card-corner-4.svg`,
  "prenatal-massage": `${base}/card-corner-5.svg`,
  "postpartum-massage": `${base}/card-corner-6.svg`,
  "childbirth-education": `${base}/card-corner-7.svg`,
  "placenta-encapsulation": `${base}/card-corner-3.svg`,
};

/** Small thematic icon accent per service, matched by filename meaning. */
export const serviceCardIconSrc: Partial<Record<ServiceSlug, string>> = {
  "birth-doula": `${base}/icon-mother-baby-embrace.svg`,
  "overnight-newborn": `${base}/icon-new-life.svg`,
  "postpartum-care": `${base}/icon-parent-child-bond.svg`,
  lactation: `${base}/icon-eucalyptus-sprig.svg`,
  "prenatal-massage": `${base}/icon-pregnancy-silhouette.svg`,
  "postpartum-massage": `${base}/icon-lotus-wellness.svg`,
  "childbirth-education": `${base}/icon-family-connection.svg`,
  "placenta-encapsulation": `${base}/icon-parent-child-bond.svg`,
};
