import { describe, expect, it } from "vitest";
import { DEFAULT_COVERAGE_CONFIG } from "@/lib/coverage/defaults";
import { resolveCoverageForZip } from "@/lib/coverage/resolve";

describe("resolveCoverageForZip", () => {
  it("does not match removed Bergen County ZIP as active", () => {
    const result = resolveCoverageForZip("07631", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(false);
    expect(result.status).toBe("outside");
  });

  it("matches expanding NYC metro ZIP", () => {
    const result = resolveCoverageForZip("10001", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(true);
    if (result.match) {
      expect(result.status).toBe("expanding");
    }
  });

  it("returns outside for unknown ZIP", () => {
    const result = resolveCoverageForZip("90210", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(false);
    expect(result.status).toBe("outside");
  });

  it("prompts for ZIP when missing", () => {
    const result = resolveCoverageForZip("", DEFAULT_COVERAGE_CONFIG);
    expect(result.match).toBe(false);
    expect(result.message).toContain("ZIP");
  });
});
