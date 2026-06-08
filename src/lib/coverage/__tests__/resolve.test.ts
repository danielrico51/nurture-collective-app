import { describe, expect, it } from "vitest";
import { DEFAULT_COVERAGE_CONFIG } from "@/lib/coverage/defaults";
import { resolveCoverageForZip } from "@/lib/coverage/resolve";

describe("resolveCoverageForZip", () => {
  it("matches North Jersey ZIP (Bergen County)", () => {
    const result = resolveCoverageForZip("07631", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.region.id).toBe("north-jersey");
      expect(result.status).toBe("active");
    }
  });

  it("matches Central Jersey ZIP (Middlesex County)", () => {
    const result = resolveCoverageForZip("08817", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.region.id).toBe("central-jersey");
    }
  });

  it("matches South Jersey ZIP (Camden County)", () => {
    const result = resolveCoverageForZip("08103", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.region.id).toBe("south-jersey");
    }
  });

  it("matches Lower Hudson Valley ZIP (Westchester County)", () => {
    const result = resolveCoverageForZip("10583", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.region.id).toBe("lower-hudson-valley");
    }
  });

  it("matches Dutchess County ZIP", () => {
    const result = resolveCoverageForZip("12601", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.region.id).toBe("lower-hudson-valley");
    }
  });

  it("returns outside for ZIP outside service areas", () => {
    const result = resolveCoverageForZip("90210", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(false);
    expect(result.status).toBe("outside");
  });

  it("returns outside for NYC ZIP outside Lower Hudson prefixes", () => {
    const result = resolveCoverageForZip("10001", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(false);
    expect(result.status).toBe("outside");
  });

  it("prompts for ZIP when missing", () => {
    const result = resolveCoverageForZip("", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(false);
    expect(result.message).toContain("ZIP");
  });
});
