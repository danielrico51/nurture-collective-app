import { describe, expect, it } from "vitest";
import { isJunkImportPackage, providerHasRevenue } from "@/lib/providers/cleanup";
import type { ProviderStats } from "@/types/provider";
import type { EngagementPackage } from "@/types/serviceEngagement";

const zeroStats: ProviderStats = {
  providerId: "p1",
  engagementCount: 1,
  primaryEngagementCount: 0,
  lifetimeClientFeeCents: 0,
  lifetimeDoulaPayoutCents: 0,
  ytdEngagementCount: 0,
  ytdClientFeeCents: 0,
  ytdDoulaPayoutCents: 0,
};

const revenueStats: ProviderStats = {
  ...zeroStats,
  lifetimeClientFeeCents: 10000,
};

const basePackage: EngagementPackage = {
  packageId: "pkg1",
  engagementId: "eng1",
  sortOrder: 1,
  label: "AEH Birth",
  clientFeeCents: 0,
  hoursTotal: null,
  hoursAnnotation: "",
  schedulePattern: "",
  doulaFeeCents: null,
  providerId: "p1",
  notes: "",
  createdAt: "",
  updatedAt: "",
};

describe("providerHasRevenue", () => {
  it("returns true when client fees or payouts exist", () => {
    expect(providerHasRevenue(revenueStats)).toBe(true);
    expect(
      providerHasRevenue({
        ...zeroStats,
        lifetimeDoulaPayoutCents: 5000,
      })
    ).toBe(true);
    expect(providerHasRevenue(zeroStats)).toBe(false);
  });
});

describe("isJunkImportPackage", () => {
  it("flags zero-fee add-on rows tied to zero-revenue providers", () => {
    expect(isJunkImportPackage(basePackage, zeroStats)).toBe(true);
  });

  it("keeps primary packages and paid add-ons", () => {
    expect(
      isJunkImportPackage({ ...basePackage, sortOrder: 0 }, zeroStats)
    ).toBe(false);
    expect(
      isJunkImportPackage(
        { ...basePackage, clientFeeCents: 150000 },
        zeroStats
      )
    ).toBe(false);
    expect(isJunkImportPackage(basePackage, revenueStats)).toBe(false);
  });
});
