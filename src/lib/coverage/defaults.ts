import { coverageIntro } from "@/content/site";
import type { CoverageConfig } from "@/types/coverage";

/** Default coverage seeded from The Nesting Place service area — overridden by admin config when saved. */
export const DEFAULT_COVERAGE_CONFIG: CoverageConfig = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  intro: coverageIntro,
  regions: [
    {
      id: "bergen-nj",
      name: "Bergen County, NJ",
      status: "active",
      services:
        "Birth doula, postpartum care, overnight newborn care, lactation support, prenatal massage",
      zipPrefixes: ["076"],
      center: { lat: 40.959, lng: -74.074 },
      radiusMiles: 18,
      coverageRatio: 100,
      conciergeNote:
        "Full in-person Nesting Place services are available throughout Bergen County.",
    },
    {
      id: "northern-nj",
      name: "Northern New Jersey",
      status: "active",
      services:
        "Birth doula, postpartum care, overnight newborn care, lactation support, prenatal massage",
      zipPrefixes: ["070", "071", "072", "073", "074", "075", "077", "078", "079"],
      center: { lat: 40.85, lng: -74.35 },
      radiusMiles: 35,
      coverageRatio: 90,
    },
    {
      id: "nyc-metro",
      name: "NYC Metro & surrounding",
      status: "expanding",
      services:
        "Select virtual and in-person support — expanding provider network",
      zipPrefixes: ["100", "101", "102", "103", "104", "110", "111", "112", "113"],
      center: { lat: 40.75, lng: -73.98 },
      radiusMiles: 25,
      coverageRatio: 35,
      conciergeNote:
        "We're actively expanding into the NYC metro. Some services may be virtual or waitlist while we grow.",
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
