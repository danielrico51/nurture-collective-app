import { coverageIntro } from "@/content/site";
import type { CoverageConfig } from "@/types/coverage";

/** Default coverage seeded from The Nesting Place service area — overridden by admin config when saved. */
export const DEFAULT_COVERAGE_CONFIG: CoverageConfig = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  intro: coverageIntro,
  regions: [
    {
      id: "northern-nj",
      name: "Northern New Jersey",
      status: "active",
      services:
        "Bergen, Essex, Hudson, Passaic, Morris, Union, Middlesex, Somerset, Monmouth, and surrounding counties",
      zipPrefixes: ["070", "071", "072", "073", "074", "075", "077", "078", "079"],
      center: { lat: 40.85, lng: -74.35 },
      radiusMiles: 35,
      coverageRatio: 90,
    },
    {
      id: "lower-hudson-valley",
      name: "Lower Hudson Valley, NY",
      status: "active",
      services:
        "Birth doula, postpartum support, overnight newborn support, lactation, prenatal massage",
      zipPrefixes: ["105", "106", "107", "108", "109"],
      center: { lat: 41.1, lng: -73.9 },
      radiusMiles: 30,
      coverageRatio: 85,
    },
    {
      id: "national-waitlist",
      name: "Outside current regions",
      status: "waitlist",
      services: "Join the waitlist — we use demand to plan new markets",
      zipPrefixes: [],
      center: { lat: 39.5, lng: -98.35 },
      radiusMiles: 2000,
      coverageRatio: 0,
      conciergeNote:
        "We aren't in their area yet — warmly invite them to share their ZIP and join the waitlist.",
    },
  ],
};

export const getPublicCoverageRegions = (config: CoverageConfig = DEFAULT_COVERAGE_CONFIG) =>
  config.regions.filter(
    (region) =>
      region.status === "active" &&
      region.id !== "national-waitlist" &&
      region.id !== "bergen-nj"
  );
