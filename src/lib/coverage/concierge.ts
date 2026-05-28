import { resolveCoverageForZip } from "@/lib/coverage/resolve";
import type { CoverageConfig } from "@/types/coverage";

const statusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "ACTIVE — full service";
    case "expanding":
      return "EXPANDING — partial availability";
    case "waitlist":
      return "WAITLIST";
    default:
      return status.toUpperCase();
  }
};

/** System prompt block injected into the concierge from live admin coverage config. */
export const formatCoverageForConcierge = (
  config: CoverageConfig,
  locationZip?: string | null
): string => {
  const regionLines = config.regions
    .filter((region) => region.id !== "national-waitlist")
    .map(
      (region) =>
        `- ${region.name}: ${statusLabel(region.status)}, ${region.coverageRatio}% coverage capacity. ZIP prefixes: ${region.zipPrefixes.join(", ") || "n/a"}. ${region.services}${region.conciergeNote ? ` Note: ${region.conciergeNote}` : ""}`
    )
    .join("\n");

  const lookup = locationZip
    ? resolveCoverageForZip(locationZip, config)
    : null;

  const userLocationBlock = lookup
    ? `\nUSER LOCATION CHECK (ZIP ${locationZip}): ${lookup.message}`
    : "\nUSER LOCATION: Not confirmed — ask for their ZIP code after learning their stage/needs to verify coverage.";

  return `LIVE COVERAGE MAP (admin-managed — always use this, not general knowledge):
${config.intro}

Regions:
${regionLines}
${userLocationBlock}

COVERAGE RULES:
- Ask for ZIP code (location) early — after maternal stage or when they mention where they live
- If ACTIVE with high coverage ratio: confidently offer in-person Nesting Place services
- If EXPANDING with lower ratio: explain we're growing in their area; set expectations on wait times or virtual options
- If outside regions: warm waitlist invitation — capture ZIP, email, and interest for expansion planning
- Never promise in-person care outside an ACTIVE region`;
};
