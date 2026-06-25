import { describe, expect, it } from "vitest";
import { buildCsvContent, formatCentsAsDollars } from "@/lib/dashboard/csvExport";

describe("csvExport", () => {
  it("formats cents as dollar strings", () => {
    expect(formatCentsAsDollars(709600)).toBe("7096.00");
    expect(formatCentsAsDollars(0)).toBe("0.00");
  });

  it("escapes commas and quotes in csv cells", () => {
    const content = buildCsvContent(
      ["Client", "Notes"],
      [["Smith, Jane", 'Said "hello"']]
    );
    expect(content).toContain('"Smith, Jane"');
    expect(content).toContain('"Said ""hello"""');
  });
});
