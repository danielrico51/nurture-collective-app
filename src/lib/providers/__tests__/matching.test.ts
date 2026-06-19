import { describe, expect, it } from "vitest";
import {
  collectUniqueProviderLabels,
  matchProviderByLabel,
} from "@/lib/providers/matching";
import type { ProviderRecord } from "@/types/provider";

const sampleProviders: ProviderRecord[] = [
  {
    providerId: "1",
    displayName: "Paula",
    aliases: ["Paula"],
    roles: ["postpartum_doula"],
    email: "",
    phone: "",
    defaultHourlyRateCents: null,
    notes: "",
    status: "active",
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    providerId: "2",
    displayName: "Laura",
    aliases: ["Laura", "LZ/LL"],
    roles: ["postpartum_doula"],
    email: "",
    phone: "",
    defaultHourlyRateCents: null,
    notes: "",
    status: "active",
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
  },
];

describe("matchProviderByLabel", () => {
  it("matches display name case-insensitively", () => {
    expect(matchProviderByLabel("paula", sampleProviders)?.providerId).toBe("1");
  });

  it("matches aliases", () => {
    expect(matchProviderByLabel("LZ/LL", sampleProviders)?.providerId).toBe("2");
  });

  it("returns null for unknown labels", () => {
    expect(matchProviderByLabel("Unknown", sampleProviders)).toBeNull();
  });
});

describe("collectUniqueProviderLabels", () => {
  it("filters payment annotations and deduplicates", () => {
    const labels = collectUniqueProviderLabels([
      "Paula",
      "paula",
      "CC",
      "$500",
      "Laura",
      "Leslie",
    ]);
    expect(labels).toEqual(["Laura", "Leslie", "Paula"]);
  });
});
