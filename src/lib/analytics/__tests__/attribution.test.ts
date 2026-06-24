import { describe, expect, it } from "vitest";
import {
  attributionToEventParams,
  mergeMarketingAttribution,
  parseMarketingAttributionFromSearch,
  resolveLeadSource,
} from "@/lib/analytics/attribution";

describe("marketing attribution", () => {
  it("parses utm and click ids from search params", () => {
    expect(
      parseMarketingAttributionFromSearch(
        "?utm_source=google&utm_medium=cpc&utm_campaign=spring&gclid=abc123"
      )
    ).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "spring",
      gclid: "abc123",
    });
  });

  it("merges first-touch attribution and keeps landing page", () => {
    expect(
      mergeMarketingAttribution(
        null,
        parseMarketingAttributionFromSearch("?utm_source=newsletter"),
        "/contact"
      )
    ).toMatchObject({
      utm_source: "newsletter",
      landing_page: "/contact",
    });
  });

  it("updates gclid when a paid click arrives later in the session", () => {
    const first = mergeMarketingAttribution(
      null,
      parseMarketingAttributionFromSearch("?utm_source=google&utm_medium=organic"),
      "/"
    );
    const second = mergeMarketingAttribution(
      first,
      parseMarketingAttributionFromSearch("?gclid=late-click"),
      "/contact"
    );

    expect(second).toMatchObject({
      utm_source: "google",
      utm_medium: "organic",
      gclid: "late-click",
      landing_page: "/",
    });
  });

  it("resolves lead source for Google Ads traffic", () => {
    expect(
      resolveLeadSource({
        gclid: "abc",
        utm_source: "google",
        utm_medium: "cpc",
      })
    ).toBe("google_ads");
  });

  it("maps attribution to analytics event params", () => {
    expect(
      attributionToEventParams({
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "brand",
        gclid: "abc",
        landing_page: "/services",
      })
    ).toMatchObject({
      lead_source: "google_ads",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "brand",
      gclid: "abc",
      landing_page: "/services",
    });
  });
});
