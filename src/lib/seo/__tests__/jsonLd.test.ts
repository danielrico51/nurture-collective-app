import { describe, expect, it, vi } from "vitest";
import { publishedCoreServices } from "@/content/site";
import { teamMembers } from "@/content/team";
import {
  buildAboutPageJsonLd,
  buildArticleJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
  buildServicesPageJsonLd,
  buildWebSiteJsonLd,
  ORGANIZATION_ID,
} from "@/lib/seo/jsonLd";

describe("buildFaqPageJsonLd", () => {
  it("maps FAQ items to schema.org Question entities", () => {
    const schema = buildFaqPageJsonLd([
      { q: "What services are available?", a: "Birth doula and postpartum support." },
    ]);

    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "What services are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Birth doula and postpartum support.",
      },
    });
  });
});

describe("buildWebSiteJsonLd", () => {
  it("uses the canonical site URL and organization publisher", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
    const schema = buildWebSiteJsonLd();

    expect(schema).toMatchObject({
      "@type": "WebSite",
      url: "https://www.nesting-place.com",
      name: "The Nesting Place",
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "en-US",
    });
  });
});

describe("buildLocalBusinessJsonLd", () => {
  it("includes tri-state area served and contact details", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
    const schema = buildLocalBusinessJsonLd();

    expect(schema["@type"]).toBe("LocalBusiness");
    expect(schema.telephone).toBe("+12016233629");
    expect(schema.areaServed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "New Jersey" }),
        expect.objectContaining({ name: "Pennsylvania" }),
      ])
    );
    expect(schema.address).toMatchObject({
      addressLocality: "Ridgewood",
      addressRegion: "NJ",
    });
  });
});

describe("buildServicesPageJsonLd", () => {
  it("lists each published service", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
    const schema = buildServicesPageJsonLd(publishedCoreServices);

    expect(schema.itemListElement).toHaveLength(publishedCoreServices.length);
    expect(schema.itemListElement[0]?.item).toMatchObject({
      "@type": "Service",
      provider: { "@id": ORGANIZATION_ID },
      url: `https://www.nesting-place.com/services#${publishedCoreServices[0]?.slug}`,
    });
  });
});

describe("buildAboutPageJsonLd", () => {
  it("includes team members as employees", () => {
    const schema = buildAboutPageJsonLd(teamMembers);
    expect(schema.employee).toHaveLength(teamMembers.length);
    expect(schema.employee[0]).toMatchObject({
      "@type": "Person",
      name: teamMembers[0]?.name,
    });
  });
});

describe("buildArticleJsonLd", () => {
  it("builds BlogPosting metadata for articles", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
    const schema = buildArticleJsonLd({
      title: "Why prenatal massage matters",
      description: "Comfort during pregnancy.",
      slug: "why-prenatal-massage",
      date: "2026-01-05",
      author: "The Nesting Place",
    });

    expect(schema).toMatchObject({
      "@type": "BlogPosting",
      headline: "Why prenatal massage matters",
      datePublished: "2026-01-05",
    });
    expect(schema.mainEntityOfPage).toMatchObject({
      "@id": "https://www.nesting-place.com/blog/why-prenatal-massage",
    });
  });
});
