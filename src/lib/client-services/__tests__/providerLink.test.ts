import { describe, expect, it } from "vitest";
import { matchProviderByLabel } from "@/lib/providers/matching";
import type { ProviderRecord } from "@/types/provider";

const sampleProviders: ProviderRecord[] = [
  {
    providerId: "p1",
    displayName: "Amanda Lee",
    aliases: ["Amanda"],
    roles: ["postpartum_doula"],
    email: "",
    phone: "",
    status: "active",
    defaultHourlyRateCents: null,
    notes: "",
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("manual service provider matching", () => {
  it("matches legacy free-text provider labels to registry entries", () => {
    expect(matchProviderByLabel("Amanda", sampleProviders)?.providerId).toBe("p1");
    expect(matchProviderByLabel("amanda lee", sampleProviders)?.providerId).toBe(
      "p1"
    );
    expect(matchProviderByLabel("Unknown", sampleProviders)).toBeNull();
  });
});
