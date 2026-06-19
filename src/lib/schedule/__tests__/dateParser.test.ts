import { describe, expect, it } from "vitest";
import { parseVisitDatesLabel } from "../dateParser";

describe("parseVisitDatesLabel", () => {
  it("returns empty for blank input", () => {
    expect(parseVisitDatesLabel("", 2025)).toEqual([]);
    expect(parseVisitDatesLabel("   ", 2025)).toEqual([]);
  });

  it("parses a single month/day", () => {
    expect(parseVisitDatesLabel("1/10", 2025)).toEqual(["2025-01-10"]);
  });

  it("parses comma-separated days in the same month", () => {
    expect(parseVisitDatesLabel("1/17,19,24", 2025)).toEqual([
      "2025-01-17",
      "2025-01-19",
      "2025-01-24",
    ]);
  });

  it("parses multiple full dates across months", () => {
    expect(parseVisitDatesLabel("1/28, 1/29, 2/4,6,9", 2025)).toEqual([
      "2025-01-28",
      "2025-01-29",
      "2025-02-04",
      "2025-02-06",
      "2025-02-09",
    ]);
  });

  it("deduplicates repeated dates", () => {
    expect(parseVisitDatesLabel("2/13,14,13", 2025)).toEqual([
      "2025-02-13",
      "2025-02-14",
    ]);
  });

  it("supports explicit year on a segment", () => {
    expect(parseVisitDatesLabel("1/5/24", 2025)).toEqual(["2024-01-05"]);
  });
});
