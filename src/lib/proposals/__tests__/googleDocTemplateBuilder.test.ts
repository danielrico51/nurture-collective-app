import { describe, expect, it } from "vitest";
import { buildFormattedTemplateRequests } from "@/lib/proposals/googleDocTemplateBuilder";
import { FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS } from "@/lib/proposals/proposalDocTemplateFormatted";
import { PROPOSAL_TEMPLATE_PLACEHOLDERS } from "@/lib/proposals/proposalDocTemplate";

describe("buildFormattedTemplateRequests", () => {
  it("includes logo, bullets, bold headings, and all placeholders", () => {
    const { insertRequests, formatRequests } = buildFormattedTemplateRequests({
      segments: FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS,
      logoUri: "https://example.com/logo.png",
    });

    const insertedText = insertRequests
      .map((request) => request.insertText?.text ?? "")
      .join("");

    for (const placeholder of PROPOSAL_TEMPLATE_PLACEHOLDERS) {
      expect(insertedText).toContain(`{{${placeholder}}}`);
    }

    expect(
      insertRequests.some((request) => request.insertInlineImage?.uri)
    ).toBe(true);
    expect(
      formatRequests.filter((request) => request.createParagraphBullets).length
    ).toBeGreaterThanOrEqual(5);
    expect(
      formatRequests.filter((request) => request.updateTextStyle).length
    ).toBeGreaterThan(10);
    expect(
      formatRequests.some(
        (request) => request.updateParagraphStyle?.paragraphStyle?.alignment === "CENTER"
      )
    ).toBe(true);
  });
});
