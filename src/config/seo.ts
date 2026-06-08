import { brands } from "@/content/site";
import { getSiteUrl, toAbsoluteUrl } from "@/config/siteUrl";
import type { Metadata } from "next";

export const SERVICE_STATES = [
  "New Jersey",
  "New York",
  "Connecticut",
  "Pennsylvania",
] as const;

export const SERVICE_STATE_CODES = ["NJ", "NY", "CT", "PA"] as const;

export const REGIONAL_SEO_PHRASE =
  "Northern New Jersey, New York, Connecticut, and Pennsylvania";

export const REGIONAL_SEO_SHORT = "NJ, NY, CT & PA";

/** Core local + service keywords appended to page-level metadata. */
export const BASE_SEO_KEYWORDS = [
  "birth doula",
  "postpartum doula",
  "overnight newborn care",
  "lactation consultant",
  "prenatal massage",
  "maternal wellness",
  "postpartum support",
  "newborn care",
  "fourth trimester support",
  "childbirth education",
  ...SERVICE_STATE_CODES.flatMap((state) => [
    `birth doula ${state}`,
    `postpartum support ${state}`,
    `lactation consultant ${state}`,
  ]),
  "birth doula Northern New Jersey",
  "postpartum doula Bergen County",
  "birth doula Hudson Valley",
  "overnight newborn care New Jersey",
  "The Nesting Place",
] as const;

export const DEFAULT_OG_IMAGE_PATH = "/images/hero-home.jpg";

export const PUBLIC_MARKETING_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/services", changeFrequency: "weekly" as const, priority: 0.95 },
  { path: "/for-moms", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/events-and-classes", changeFrequency: "weekly" as const, priority: 0.75 },
  { path: "/benefits-and-insurance", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/gift-cards", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/sources", changeFrequency: "monthly" as const, priority: 0.55 },
  { path: "/for-providers", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.2 },
] as const;

export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/apps",
  "/dashboard",
  "/management",
  "/intake",
  "/care/start",
  "/account",
  "/signin",
  "/signup",
  "/oauth",
] as const;

interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  openGraphType?: "website" | "article";
}

const uniqueKeywords = (keywords: string[]): string[] =>
  Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)));

export const buildRegionalDescription = (lead: string): string => {
  const trimmed = lead.trim().replace(/\s+/g, " ");
  if (/NJ|NY|CT|PA|New Jersey|New York|Connecticut|Pennsylvania/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} Serving families in ${REGIONAL_SEO_SHORT}.`;
};

export const buildPageMetadata = ({
  title,
  description,
  path,
  keywords = [],
  openGraphType = "website",
}: BuildPageMetadataInput): Metadata => {
  const canonical = toAbsoluteUrl(path);
  const imageUrl = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const siteName = brands.nestingPlace.name;
  const mergedKeywords = uniqueKeywords([...keywords, ...BASE_SEO_KEYWORDS]);

  return {
    title,
    description: buildRegionalDescription(description),
    keywords: mergedKeywords,
    alternates: { canonical },
    openGraph: {
      type: openGraphType,
      locale: "en_US",
      url: canonical,
      siteName,
      title,
      description: buildRegionalDescription(description),
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: 681,
          alt: `${siteName} — maternal wellness and postpartum support`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: buildRegionalDescription(description),
      images: [imageUrl],
    },
  };
};

export const buildRootSiteMetadata = (): Metadata => {
  const siteName = brands.nestingPlace.name;
  const siteUrl = getSiteUrl();
  const imageUrl = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const description = buildRegionalDescription(
    `${siteName} — birth doula support, overnight newborn care, postpartum support, lactation consulting, and prenatal massage with real people guiding you through every stage of motherhood.`
  );

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [...BASE_SEO_KEYWORDS],
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName,
      title: siteName,
      description,
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: 681,
          alt: `${siteName} — maternal wellness and postpartum support`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
};

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};
