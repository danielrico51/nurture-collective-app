import type {
  DashboardEngagementAnalytics,
  DashboardEngagementAnalyticsCore,
  DashboardTopProvider,
  DashboardYearBucket,
} from "@/types/dashboard";

export const yearBucketFor = (
  analytics: Pick<DashboardEngagementAnalyticsCore, "byYear">,
  year: number
): DashboardYearBucket | undefined => analytics.byYear.find((row) => row.year === year);

export const topProvidersForYear = (
  analytics: Pick<DashboardEngagementAnalyticsCore, "topProvidersByYear">,
  year: number
): DashboardTopProvider[] => analytics.topProvidersByYear[String(year)] ?? [];

export const withSelectedYear = (
  core: DashboardEngagementAnalyticsCore,
  year: number
): DashboardEngagementAnalytics => {
  const bucket = yearBucketFor(core, year);
  const ytdEngagementCount = bucket?.engagementCount ?? 0;
  const ytdClientFeeCents = bucket?.clientFeeCents ?? 0;
  const ytdDoulaPayoutCents = bucket?.doulaPayoutCents ?? 0;

  return {
    ...core,
    year,
    summary: {
      ...core.summary,
      ytdEngagementCount,
      ytdClientFeeCents,
      ytdDoulaPayoutCents,
      ytdMarginCents: ytdClientFeeCents - ytdDoulaPayoutCents,
    },
    topProviders: topProvidersForYear(core, year),
  };
};
