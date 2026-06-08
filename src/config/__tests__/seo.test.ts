import { describe, expect, it, vi } from "vitest";
import {
  BASE_SEO_KEYWORDS,
  buildPageMetadata,
  buildRegionalDescription,
  ROBOTS_DISALLOW_PATHS,
} from "@/config/seo";
import { getSiteUrl, toAbsoluteUrl } from "@/config/siteUrl";

describe("getSiteUrl", () => {
  it("defaults to nesting-place.com when env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl()).toBe("https://www.nesting-place.com");
  });

  it("strips trailing slashes from configured URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com/");
    expect(getSiteUrl()).toBe("https://www.nesting-place.com");
  });
});

describe("toAbsoluteUrl", () => {
  it("builds absolute paths from the site origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
    expect(toAbsoluteUrl("/services")).toBe("https://www.nesting-place.com/services");
  });
});

describe("buildRegionalDescription", () => {
  it("appends tri-state coverage when missing from copy", () => {
    expect(buildRegionalDescription("Birth doula support for your family.")).toContain(
      "NJ, NY, CT & PA"
    );
  });

  it("leaves copy unchanged when states are already mentioned", () => {
    const description =
      "Birth doula support for families in New Jersey, New York, Connecticut, and Pennsylvania.";
    expect(buildRegionalDescription(description)).toBe(description);
  });
});

describe("buildPageMetadata", () => {
  it("includes canonical, keywords, and social metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.nesting-place.com");
    const metadata = buildPageMetadata({
      title: "Birth Doula Services",
      description: "Continuous labor support from experienced doulas.",
      path: "/services",
      keywords: ["birth doula Bergen County"],
    });

    expect(metadata.alternates?.canonical).toBe("https://www.nesting-place.com/services");
    expect(metadata.keywords).toEqual(
      expect.arrayContaining(["birth doula Bergen County", ...BASE_SEO_KEYWORDS])
    );
    expect(metadata.openGraph?.url).toBe("https://www.nesting-place.com/services");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("ROBOTS_DISALLOW_PATHS", () => {
  it("blocks private app surfaces from crawlers", () => {
    expect(ROBOTS_DISALLOW_PATHS).toEqual(
      expect.arrayContaining(["/admin", "/apps", "/intake", "/care/start"])
    );
  });
});
