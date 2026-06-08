import { coverageIntro } from "@/content/site";
import type { CoverageConfig, CoverageRegionConfig } from "@/types/coverage";

const CORE_SERVICES =
  "birth doula support, postpartum support, overnight newborn support, lactation support, prenatal massage, and childbirth education";

const ACTIVE_REGIONS: CoverageRegionConfig[] = [
  {
    id: "north-jersey",
    name: "North Jersey",
    status: "active",
    services: `Bergen, Essex, Hudson, Passaic, and Morris Counties — ${CORE_SERVICES}`,
    zipPrefixes: ["076", "070", "071", "073", "074", "075", "078", "079"],
    center: { lat: 40.95, lng: -74.2 },
    radiusMiles: 28,
    coverageRatio: 95,
  },
  {
    id: "central-jersey",
    name: "Central Jersey",
    status: "active",
    services: `Union, Middlesex, Somerset, and Monmouth Counties — ${CORE_SERVICES}`,
    zipPrefixes: ["088", "089", "077"],
    center: { lat: 40.49, lng: -74.45 },
    radiusMiles: 30,
    coverageRatio: 92,
  },
  {
    id: "south-jersey",
    name: "South Jersey",
    status: "active",
    services: `Burlington, Camden, Gloucester, and Atlantic Counties — ${CORE_SERVICES}`,
    zipPrefixes: ["080", "081", "082", "083", "084"],
    center: { lat: 39.79, lng: -75.12 },
    radiusMiles: 35,
    coverageRatio: 88,
  },
  {
    id: "lower-hudson-valley",
    name: "Lower Hudson Valley, NY",
    status: "active",
    services:
      "Westchester, Rockland, Putnam, Orange, and Dutchess Counties — birth doula, postpartum support, overnight newborn support, lactation support, and prenatal massage",
    zipPrefixes: ["105", "106", "107", "108", "109", "125", "126"],
    center: { lat: 41.1, lng: -73.9 },
    radiusMiles: 40,
    coverageRatio: 90,
  },
];

/** Default coverage seeded from The Nesting Place service area — overridden by admin config when saved. */
export const DEFAULT_COVERAGE_CONFIG: CoverageConfig = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  intro: coverageIntro,
  regions: [
    ...ACTIVE_REGIONS,
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
      region.id !== "bergen-nj" &&
      region.id !== "northern-nj"
  );
