import { engagementRef, type CrmStorageIndex } from "@/lib/clients/crmIndexLoader";
import { buildYoyRows } from "@/lib/dashboard/trends";
import type {
  DashboardEngagementAnalyticsCore,
  DashboardMonthlyCount,
  DashboardMonthlyRevenue,
  DashboardTopProvider,
  DashboardYearBucket,
} from "@/types/dashboard";
import type { ProviderRecord } from "@/types/provider";
import type {
  EngagementServiceType,
  EngagementStatus,
  ServiceEngagement,
} from "@/types/serviceEngagement";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const monthKey = (isoDate: string): string | null => {
  if (!isoDate || isoDate.length < 7) return null;
  return isoDate.slice(0, 7);
};

const buildLastMonths = (count: number): string[] => {
  const months: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(cursor);
    d.setMonth(cursor.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
};

const emptyYearBucket = (year: number): DashboardYearBucket => ({
  year,
  engagementCount: 0,
  clientFeeCents: 0,
  doulaPayoutCents: 0,
  birthCount: 0,
  postpartumCount: 0,
});

const emptyServiceType = (): Record<
  EngagementServiceType,
  { count: number; clientFeeCents: number }
> => ({
  birth: { count: 0, clientFeeCents: 0 },
  postpartum: { count: 0, clientFeeCents: 0 },
  other: { count: 0, clientFeeCents: 0 },
});

const emptyStatus = (): Record<EngagementStatus, number> => ({
  booked: 0,
  active: 0,
  completed: 0,
  cancelled: 0,
});

const isUpcoming = (engagement: ServiceEngagement, today: string): boolean => {
  if (engagement.status === "cancelled" || engagement.status === "completed") {
    return false;
  }
  if (engagement.estimatedDate) {
    return engagement.estimatedDate >= today;
  }
  return engagement.status === "booked" || engagement.status === "active";
};

const isCompleted = (engagement: ServiceEngagement, today: string): boolean => {
  if (engagement.status === "completed") return true;
  if (engagement.status === "cancelled") return false;
  if (engagement.estimatedDate && engagement.estimatedDate < today) return true;
  return false;
};

const finalizeTopProviders = (
  providerStats: Map<
    string,
    { engagementKeys: Set<string>; clientFeeCents: number; doulaPayoutCents: number }
  >,
  providerNames: Map<string, string>
): DashboardTopProvider[] =>
  Array.from(providerStats.entries())
    .map(([providerId, stats]) => ({
      providerId,
      displayName: providerNames.get(providerId) ?? providerId,
      engagementCount: stats.engagementKeys.size,
      ytdClientFeeCents: stats.clientFeeCents,
      ytdDoulaPayoutCents: stats.doulaPayoutCents,
    }))
    .sort((a, b) => b.ytdClientFeeCents - a.ytdClientFeeCents)
    .slice(0, 10);

export const computeEngagementAnalyticsCore = (
  crmIndex: CrmStorageIndex,
  providers: ProviderRecord[]
): DashboardEngagementAnalyticsCore => {
  const today = todayIso();
  const lastMonths = buildLastMonths(12);
  const monthlyBookingMap = new Map(lastMonths.map((m) => [m, 0]));
  const monthlyBookingsHistoryMap = new Map<string, number>();
  const monthlyRevenueHistoryMap = new Map<string, DashboardMonthlyRevenue>();

  const { clientSummaries, schedule: artifacts } = crmIndex;
  const providerNames = new Map(
    providers.map((provider) => [
      provider.providerId,
      provider.displayName || provider.providerId,
    ])
  );

  const yearMap = new Map<number, DashboardYearBucket>();
  const byServiceType = emptyServiceType();
  const byStatus = emptyStatus();
  const providerStatsByYear = new Map<
    number,
    Map<
      string,
      { engagementKeys: Set<string>; clientFeeCents: number; doulaPayoutCents: number }
    >
  >();

  let totalEngagements = 0;
  let historicEngagements = 0;
  let liveEngagements = 0;
  let upcomingEngagements = 0;
  let completedEngagements = 0;
  let cancelledEngagements = 0;

  for (const engagement of artifacts.engagements) {
    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];

    totalEngagements += 1;
    if (engagement.importSource) historicEngagements += 1;
    else liveEngagements += 1;

    byStatus[engagement.status] += 1;
    if (engagement.status === "cancelled") cancelledEngagements += 1;
    if (isUpcoming(engagement, today)) upcomingEngagements += 1;
    if (isCompleted(engagement, today)) completedEngagements += 1;

    const bookMonth = monthKey(engagement.bookDate);
    if (bookMonth) {
      if (monthlyBookingMap.has(bookMonth)) {
        monthlyBookingMap.set(bookMonth, (monthlyBookingMap.get(bookMonth) ?? 0) + 1);
      }
      monthlyBookingsHistoryMap.set(
        bookMonth,
        (monthlyBookingsHistoryMap.get(bookMonth) ?? 0) + 1
      );
    }

    const clientFeeCents = packages.reduce((sum, pkg) => sum + pkg.clientFeeCents, 0);
    const doulaPayoutCents = payouts.reduce((sum, payout) => sum + payout.amountCents, 0);

    if (bookMonth) {
      const existing = monthlyRevenueHistoryMap.get(bookMonth) ?? {
        month: bookMonth,
        engagementCount: 0,
        clientFeeCents: 0,
        doulaPayoutCents: 0,
        marginCents: 0,
      };
      existing.engagementCount += 1;
      existing.clientFeeCents += clientFeeCents;
      existing.doulaPayoutCents += doulaPayoutCents;
      existing.marginCents = existing.clientFeeCents - existing.doulaPayoutCents;
      monthlyRevenueHistoryMap.set(bookMonth, existing);
    }

    const scheduleYear = engagement.scheduleYear;
    let yearBucket = yearMap.get(scheduleYear);
    if (!yearBucket) {
      yearBucket = emptyYearBucket(scheduleYear);
      yearMap.set(scheduleYear, yearBucket);
    }
    yearBucket.engagementCount += 1;
    yearBucket.clientFeeCents += clientFeeCents;
    yearBucket.doulaPayoutCents += doulaPayoutCents;
    if (engagement.serviceType === "birth") yearBucket.birthCount += 1;
    if (engagement.serviceType === "postpartum") yearBucket.postpartumCount += 1;

    byServiceType[engagement.serviceType].count += 1;
    byServiceType[engagement.serviceType].clientFeeCents += clientFeeCents;

    const providerIds = new Set<string>();
    if (engagement.primaryProviderId) providerIds.add(engagement.primaryProviderId);
    for (const pkg of packages) {
      if (pkg.providerId) providerIds.add(pkg.providerId);
    }
    for (const payout of payouts) {
      providerIds.add(payout.providerId);
    }

    let yearProviders = providerStatsByYear.get(scheduleYear);
    if (!yearProviders) {
      yearProviders = new Map();
      providerStatsByYear.set(scheduleYear, yearProviders);
    }

    for (const providerId of Array.from(providerIds)) {
      let row = yearProviders.get(providerId);
      if (!row) {
        row = { engagementKeys: new Set(), clientFeeCents: 0, doulaPayoutCents: 0 };
        yearProviders.set(providerId, row);
      }
      row.engagementKeys.add(ref);
    }
    for (const pkg of packages) {
      if (!pkg.providerId) continue;
      const row = yearProviders.get(pkg.providerId);
      if (row) row.clientFeeCents += pkg.clientFeeCents;
    }
    for (const payout of payouts) {
      const row = yearProviders.get(payout.providerId);
      if (row) row.doulaPayoutCents += payout.amountCents;
    }
  }

  const activeClients = clientSummaries.filter(
    (client) => client.status === "active" && !client.archivedAt
  ).length;

  const byYear = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  const topProvidersByYear: Record<string, DashboardTopProvider[]> = {};
  for (const [year, stats] of Array.from(providerStatsByYear.entries())) {
    topProvidersByYear[String(year)] = finalizeTopProviders(stats, providerNames);
  }

  const monthlyEngagementBookings: DashboardMonthlyCount[] = lastMonths.map((month) => ({
    month,
    count: monthlyBookingMap.get(month) ?? 0,
  }));

  return {
    generatedAt: new Date().toISOString(),
    indexLoadedAt: crmIndex.loadedAt,
    summary: {
      totalEngagements,
      historicEngagements,
      liveEngagements,
      totalClients: clientSummaries.length,
      activeClients,
      upcomingEngagements,
      completedEngagements,
      cancelledEngagements,
    },
    byYear,
    byServiceType,
    byStatus,
    monthlyEngagementBookings,
    monthlyBookingsHistory: Array.from(monthlyBookingsHistoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    monthlyRevenueHistory: Array.from(monthlyRevenueHistoryMap.values()).sort(
      (a, b) => a.month.localeCompare(b.month)
    ),
    yoyByYear: buildYoyRows(byYear),
    topProvidersByYear,
  };
};
