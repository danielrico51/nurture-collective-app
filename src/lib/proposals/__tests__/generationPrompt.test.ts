import { describe, expect, it } from "vitest";
import {
  buildProposalUserPrompt,
  PROPOSAL_GENERATION_SYSTEM_PROMPT,
  serializeExampleForPrompt,
} from "@/lib/proposals/generationPrompt";
import { BUILTIN_PROPOSAL_LIBRARY } from "@/lib/proposals/library/builtin";
import type { ProposalContextPackage } from "@/types/proposal";

const sampleContext: ProposalContextPackage = {
  client_name: "Jordan Lee",
  services_requested: ["postpartum-doula", "overnight-newborn-care"],
  budget: "premium",
  family_size: "first-baby",
  call_summary: "Needs 3 overnight shifts per week.",
  recommended_services: ["overnight-newborn-care"],
  pricing: { budget: "premium" },
  notes: "First baby",
  maternal_stage: "newly-postpartum",
  support_interests: ["overnight-newborn-care"],
  location: "07030",
};

describe("PROPOSAL_GENERATION_SYSTEM_PROMPT", () => {
  it("instructs the model to adapt example agreements", () => {
    expect(PROPOSAL_GENERATION_SYSTEM_PROMPT).toContain("primary_format_example");
    expect(PROPOSAL_GENERATION_SYSTEM_PROMPT).toContain("blueprint");
    expect(PROPOSAL_GENERATION_SYSTEM_PROMPT).not.toContain(
      "Never copy example text verbatim"
    );
  });
});

describe("serializeExampleForPrompt", () => {
  it("includes document structure and full style reference", () => {
    const entry = BUILTIN_PROPOSAL_LIBRARY[0];
    const serialized = serializeExampleForPrompt(entry);

    expect(serialized.title).toBe(entry.title);
    expect(serialized.document_structure).toEqual(entry.document_structure);
    expect(serialized.style_reference).toEqual(entry.style_reference);
    expect(
      (serialized.style_reference as { terms: string }).terms
    ).toBeTruthy();
  });
});

describe("buildProposalUserPrompt", () => {
  it("marks the top-ranked example as primary_format_example", () => {
    const prompt = buildProposalUserPrompt({
      context: sampleContext,
      examples: BUILTIN_PROPOSAL_LIBRARY.slice(0, 2),
    });
    const parsed = JSON.parse(prompt) as {
      instruction: string;
      primary_format_example: { id: string };
      additional_format_examples: Array<{ id: string }>;
      client_context: { client_name: string };
    };

    expect(parsed.primary_format_example.id).toBe(BUILTIN_PROPOSAL_LIBRARY[0].id);
    expect(parsed.additional_format_examples).toHaveLength(1);
    expect(parsed.client_context.client_name).toBe("Jordan Lee");
    expect(parsed.instruction).toContain("adapting primary_format_example");
  });
});
