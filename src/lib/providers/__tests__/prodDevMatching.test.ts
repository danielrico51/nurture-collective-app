import { describe, expect, it } from "vitest";
import {
  auditProviderUnification,
  firstLastKey,
  mergeProviderAliases,
  normalizeIgnoringInitialPunctuation,
} from "@/lib/providers/prodDevMatching";
import type { ProviderRecord } from "@/types/provider";

const sampleProvider = (
  overrides: Partial<ProviderRecord> & Pick<ProviderRecord, "providerId" | "displayName">
): ProviderRecord => ({
  aliases: [overrides.displayName],
  roles: ["postpartum_doula"],
  email: "",
  phone: "",
  defaultHourlyRateCents: null,
  notes: "",
  status: "active",
  archivedAt: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("normalizeIgnoringInitialPunctuation", () => {
  it("treats dotted and undotted initials as equivalent", () => {
    expect(normalizeIgnoringInitialPunctuation("Lauren G. Tyler")).toBe(
      normalizeIgnoringInitialPunctuation("Lauren G Tyler")
    );
  });
});

describe("firstLastKey", () => {
  it("matches first and last tokens", () => {
    expect(firstLastKey("Lauren A Carrabs")).toBe("lauren carrabs");
  });
});

describe("auditProviderUnification", () => {
  it("matches exact display names", () => {
    const prod = sampleProvider({
      providerId: "prod-1",
      displayName: "Beth L. Stein",
    });
    const dev = sampleProvider({
      providerId: "dev-1",
      displayName: "Beth L. Stein",
    });

    const audit = auditProviderUnification([prod], [dev]);
    expect(audit.matched).toHaveLength(1);
    expect(audit.matched[0]?.tier).toBe("exact");
    expect(audit.blocked).toBe(false);
  });

  it("matches initials punctuation variants", () => {
    const prod = sampleProvider({
      providerId: "prod-1",
      displayName: "Lauren G. Tyler",
    });
    const dev = sampleProvider({
      providerId: "dev-1",
      displayName: "Lauren G Tyler",
    });

    const audit = auditProviderUnification([prod], [dev]);
    expect(audit.matched).toHaveLength(1);
    expect(audit.matched[0]?.tier).toBe("initials");
  });

  it("uses phone when names differ but phone matches", () => {
    const prod = sampleProvider({
      providerId: "prod-1",
      displayName: "Leslie Lamden",
      phone: "862 425 8851",
    });
    const dev = sampleProvider({
      providerId: "dev-1",
      displayName: "Leslie D Peterson-Cohen",
      phone: "8624258851",
    });

    const audit = auditProviderUnification([prod], [dev]);
    expect(audit.matched).toHaveLength(1);
    expect(audit.matched[0]?.tier).toBe("phone");
  });

  it("flags ambiguous dev matches", () => {
    const prod = sampleProvider({
      providerId: "prod-1",
      displayName: "Lauren G. Tyler",
    });
    const devA = sampleProvider({
      providerId: "dev-a",
      displayName: "Lauren G. Tyler",
    });
    const devB = sampleProvider({
      providerId: "dev-b",
      displayName: "Lauren G. Tyler",
    });

    const audit = auditProviderUnification([prod], [devA, devB]);
    expect(audit.matched).toHaveLength(0);
    expect(audit.ambiguous.length).toBeGreaterThan(0);
    expect(audit.blocked).toBe(true);
  });

  it("applies manual overrides", () => {
    const prod = sampleProvider({
      providerId: "prod-1",
      displayName: "Lauren G. Tyler",
    });
    const dev = sampleProvider({
      providerId: "dev-1",
      displayName: "LT",
    });

    const audit = auditProviderUnification([prod], [dev], {
      matches: [{ prodProviderId: "prod-1", devProviderId: "dev-1" }],
    });
    expect(audit.matched).toHaveLength(1);
    expect(audit.matched[0]?.tier).toBe("override");
    expect(audit.blocked).toBe(false);
  });
});

describe("mergeProviderAliases", () => {
  it("keeps both prod and dev spellings", () => {
    const prod = sampleProvider({
      providerId: "prod-1",
      displayName: "Lauren G. Tyler",
      aliases: ["Lauren G. Tyler", "LT"],
    });
    const dev = sampleProvider({
      providerId: "dev-1",
      displayName: "Lauren G Tyler",
      aliases: ["Lauren G Tyler"],
    });

    const aliases = mergeProviderAliases(prod, dev);
    expect(aliases).toHaveLength(3);
    expect(aliases).toEqual(
      expect.arrayContaining(["LT", "Lauren G Tyler", "Lauren G. Tyler"])
    );
  });
});
