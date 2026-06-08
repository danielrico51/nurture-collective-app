import { DEFAULT_OG_IMAGE_PATH, SERVICE_STATES } from "@/config/seo";
import { getSiteUrl, toAbsoluteUrl } from "@/config/siteUrl";
import { buildServiceSectionHref } from "@/config/carePaths";
import type { CoreService } from "@/content/site";
import { brands, socialLinks } from "@/content/site";
import type { TeamMemberProfile } from "@/content/team";

export const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;

export interface FaqJsonLdItem {
  q: string;
  a: string;
}

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  slug: string;
  date: string;
  updatedAt?: string;
  author?: string;
}

const socialProfileUrls = socialLinks
  .filter((link) => link.id === "instagram" || link.id === "facebook")
  .map((link) => link.href);

const areaServedStates = SERVICE_STATES.map((state) => ({
  "@type": "State" as const,
  name: state,
}));

export const buildOrganizationJsonLd = () => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: brands.nestingPlace.name,
  url: getSiteUrl(),
  logo: toAbsoluteUrl(brands.nestingPlace.markSrc),
  image: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
  email: brands.nestingPlace.email,
  telephone: brands.nestingPlace.localPhoneE164,
  description: brands.nestingPlace.description,
  sameAs: socialProfileUrls,
  areaServed: areaServedStates,
});

export const buildLocalBusinessJsonLd = () => ({
  "@type": "LocalBusiness",
  "@id": `${getSiteUrl()}/#localbusiness`,
  name: brands.nestingPlace.name,
  url: getSiteUrl(),
  image: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
  logo: toAbsoluteUrl(brands.nestingPlace.markSrc),
  telephone: brands.nestingPlace.localPhoneE164,
  email: brands.nestingPlace.email,
  description: brands.nestingPlace.description,
  priceRange: "$$",
  sameAs: socialProfileUrls,
  areaServed: areaServedStates,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ridgewood",
    addressRegion: "NJ",
    addressCountry: "US",
  },
  parentOrganization: { "@id": ORGANIZATION_ID },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Maternal wellness services",
    itemListElement: [
      "Birth doula support",
      "Overnight newborn support",
      "Postpartum support",
      "Lactation support",
      "Prenatal massage",
      "Childbirth education",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: areaServedStates,
      },
    })),
  },
});

export const buildFaqPageJsonLd = (items: readonly FaqJsonLdItem[]) => ({
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
});

export const buildServiceJsonLd = (service: CoreService) => ({
  "@type": "Service",
  name: service.title,
  description: [service.description, service.benefit].filter(Boolean).join(" "),
  provider: { "@id": ORGANIZATION_ID },
  areaServed: areaServedStates,
  url: toAbsoluteUrl(buildServiceSectionHref(service.slug)),
  serviceType: service.tag,
});

export const buildServicesPageJsonLd = (services: readonly CoreService[]) => ({
  "@type": "ItemList",
  name: "Maternal wellness services",
  itemListElement: services.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: buildServiceJsonLd(service),
  })),
});

export const buildAboutPageJsonLd = (team: readonly TeamMemberProfile[]) => ({
  ...buildOrganizationJsonLd(),
  employee: team.map((member) => ({
    "@type": "Person",
    name: member.name,
    jobTitle: member.role,
    description: member.bio,
    ...(member.imageSrc
      ? { image: toAbsoluteUrl(member.imageSrc) }
      : undefined),
  })),
});

export const buildArticleJsonLd = ({
  title,
  description,
  slug,
  date,
  updatedAt,
  author,
}: ArticleJsonLdInput) => ({
  "@type": "BlogPosting",
  headline: title,
  description,
  datePublished: date,
  dateModified: updatedAt ?? date,
  author: {
    "@type": "Organization",
    name: author ?? brands.nestingPlace.name,
  },
  publisher: {
    "@type": "Organization",
    name: brands.nestingPlace.name,
    logo: {
      "@type": "ImageObject",
      url: toAbsoluteUrl(brands.nestingPlace.markSrc),
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": toAbsoluteUrl(`/blog/${slug}`),
  },
  image: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
});

export const buildJsonLdGraph = (
  nodes: Record<string, unknown>[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});
