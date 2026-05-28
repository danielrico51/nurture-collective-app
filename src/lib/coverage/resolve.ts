import type {
  CoverageConfig,
  CoverageLookupResult,
  CoverageRegionConfig,
  CoverageStatus,
} from "@/types/coverage";

const STATUS_PRIORITY: Record<CoverageStatus, number> = {
  active: 3,
  expanding: 2,
  waitlist: 1,
};

const normalizeZip = (value: string): string | null => {
  const digits = value.replace(/\D/g, "").slice(0, 5);
  return digits.length >= 3 ? digits : null;
};

const regionMatchesZip = (region: CoverageRegionConfig, zip: string): boolean =>
  region.zipPrefixes.some((prefix) => zip.startsWith(prefix));

const buildRegionMessage = (region: CoverageRegionConfig): string => {
  const ratio =
    region.coverageRatio < 100
      ? ` (${region.coverageRatio}% capacity as we expand)`
      : "";
  const note = region.conciergeNote ? ` ${region.conciergeNote}` : "";
  return `${region.name} — ${region.status}${ratio}. Services: ${region.services}.${note}`;
};

export const resolveCoverageForZip = (
  zipInput: string | null | undefined,
  config: CoverageConfig
): CoverageLookupResult => {
  const zip = zipInput ? normalizeZip(zipInput) : null;

  if (!zip) {
    return {
      match: false,
      status: "outside",
      message:
        "Location not confirmed yet — ask for their ZIP code to check Nesting Place coverage.",
    };
  }

  const prefixMatches = config.regions.filter(
    (region) => region.id !== "national-waitlist" && regionMatchesZip(region, zip)
  );

  if (prefixMatches.length === 0) {
    const waitlist = config.regions.find((region) => region.id === "national-waitlist");
    return {
      match: false,
      status: "outside",
      message: waitlist?.conciergeNote
        ? `ZIP ${zip}: outside current service areas. ${waitlist.conciergeNote}`
        : `ZIP ${zip} is outside our current in-person service areas — invite them to join the waitlist and share demand for their area.`,
    };
  }

  const best = [...prefixMatches].sort((a, b) => {
    const statusDiff = STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status];
    if (statusDiff !== 0) return statusDiff;
    return b.coverageRatio - a.coverageRatio;
  })[0];

  return {
    match: true,
    region: best,
    status: best.status,
    message: buildRegionMessage(best),
  };
};
