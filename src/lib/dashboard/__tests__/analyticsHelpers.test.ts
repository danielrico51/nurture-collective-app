import { describe, expect, it } from "vitest";
import {
  topProvidersForYear,
  withSelectedYear,
  yearBucketFor,
} from "@/lib/dashboard/analyticsView";
import type { DashboardEngagementAnalyticsCore } from "@/types/dashboard";

const sampleCore: DashboardEngagementAnalyticsCore = {
  generatedAt: "2026-01-01T00:00:00.000Z",
  indexLoadedAt: "2026-01-01T00:00:00.000Z",
  summary: {
    totalEngagements: 2,
    historicEngagements: 1,
    liveEngagements: 1,
    totalClients: 2,
    activeClients: 1,
    upcomingEngagements: 0,
    completedEngagements: 2,
    cancelledEngagements: 0,
  },
  byYear: [
    {
      year: 2025,
      engagementCount: 1,
      clientFeeCents: 100_000,
      doulaPayoutCents: 40_000,
      birthCount: 1,
      postpartumCount: 0,
      otherCount: 0,
      birthClientFeeCents: 100_000,
      postpartumClientFeeCents: 0,
      otherClientFeeCents: 0,
      birthDoulaPayoutCents: 40_000,
      postpartumDoulaPayoutCents: 0,
      otherDoulaPayoutCents: 0,
    },
    {
      year: 2026,
      engagementCount: 1,
      clientFeeCents: 200_000,
      doulaPayoutCents: 80_000,
      birthCount: 0,
      postpartumCount: 1,
      otherCount: 0,
      birthClientFeeCents: 0,
      postpartumClientFeeCents: 200_000,
      otherClientFeeCents: 0,
      birthDoulaPayoutCents: 0,
      postpartumDoulaPayoutCents: 80_000,
      otherDoulaPayoutCents: 0,
    },
  ],
  byServiceType: {
    birth: { count: 1, clientFeeCents: 100_000 },
    postpartum: { count: 1, clientFeeCents: 200_000 },
    other: { count: 0, clientFeeCents: 0 },
  },
  byStatus: { booked: 0, active: 0, completed: 2, cancelled: 0 },
  monthlyEngagementBookings: [],
  monthlyBookingsHistory: [],
  monthlyRevenueHistory: [],
  yoyByYear: [],
  topProvidersByYear: {
    "2026": [
      {
        providerId: "p1",
        displayName: "Megan",
        engagementCount: 1,
        ytdClientFeeCents: 200_000,
        ytdDoulaPayoutCents: 80_000,
      },
    ],
  },
};

describe("dashboard analytics helpers", () => {
  it("selects year bucket and providers without refetching", () => {
    expect(yearBucketFor(sampleCore, 2026)?.clientFeeCents).toBe(200_000);
    expect(topProvidersForYear(sampleCore, 2026)[0]?.displayName).toBe("Megan");

    const selected = withSelectedYear(sampleCore, 2026);
    expect(selected.summary.ytdClientFeeCents).toBe(200_000);
    expect(selected.summary.ytdMarginCents).toBe(120_000);
    expect(selected.topProviders[0]?.displayName).toBe("Megan");
  });
});
