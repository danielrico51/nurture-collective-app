import { listClients } from "@/lib/clients/storage";
import { listCrmLeads } from "@/lib/leads/storage";
import { listProviders } from "@/lib/providers/storage";
import {
  engagementRef,
  loadAllScheduleArtifacts,
} from "@/lib/schedule/artifactLoader";
import type {
  DashboardAnalytics,
  DashboardMonthlyCount,
  DashboardYearBucket,
} from "@/types/dashboard";
import type { LeadStatus } from "@/types/lead";
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

const CONVERTED_STATUSES: LeadStatus[] = [
  "converted",
  "converted_to_member",
  "under_contract",
];

export const computeDashboardAnalytics = async (
  year = new Date().getFullYear()
): Promise<DashboardAnalytics> => {
  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonths = buildLastMonths(12);
  const monthlyLeadMap = new Map(lastMonths.map((m) => [m, 0]));
  const monthlyBookingMap = new Map(lastMonths.map((m) => [m, 0]));

  const [clients, leads, providers, artifacts] = await Promise.all([
    listClients(),
    listCrmLeads(),
    listProviders({ includeArchived: true }),
    loadAllScheduleArtifacts(),
  ]);

  const providerNames = new Map(
    providers.map((p) => [p.providerId, p.displayName || p.providerId])
  );

  const yearMap = new Map<number, DashboardYearBucket>();
  const byServiceType = emptyServiceType();
  const byStatus = emptyStatus();

  let totalEngagements = 0;
  let historicEngagements = 0;
  let liveEngagements = 0;
  let ytdEngagementCount = 0;
  let ytdClientFeeCents = 0;
  let ytdDoulaPayoutCents = 0;
  let upcomingEngagements = 0;
  let completedEngagements = 0;
  let cancelledEngagements = 0;

  const providerYtd = new Map<
    string,
    { engagementKeys: Set<string>; clientFeeCents: number; doulaPayoutCents: number }
  >();

  for (const engagement of artifacts.engagements) {
    const ref = engagementRef(engagement.clientId, engagement.engagementId);
    const packages = artifacts.packagesByEngagement.get(ref) ?? [];
    const payouts = artifacts.payoutsByEngagement.get(ref) ?? [];

    totalEngagements += 1;
    const isHistoric = Boolean(engagement.importSource);
    if (isHistoric) historicEngagements += 1;
    else liveEngagements += 1;

    byStatus[engagement.status] += 1;
    if (engagement.status === "cancelled") cancelledEngagements += 1;
    if (isUpcoming(engagement, today)) upcomingEngagements += 1;
    if (isCompleted(engagement, today)) completedEngagements += 1;

    const bookMonth = monthKey(engagement.bookDate);
    if (bookMonth && monthlyBookingMap.has(bookMonth)) {
      monthlyBookingMap.set(bookMonth, (monthlyBookingMap.get(bookMonth) ?? 0) + 1);
    }

    const clientFeeCents = packages.reduce((sum, pkg) => sum + pkg.clientFeeCents, 0);
    const doulaPayoutCents = payouts.reduce((sum, p) => sum + p.amountCents, 0);

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

    const isYtd = scheduleYear === year;
    if (isYtd) {
      ytdEngagementCount += 1;
      ytdClientFeeCents += clientFeeCents;
      ytdDoulaPayoutCents += doulaPayoutCents;
    }

    const providerIds = new Set<string>();
    if (engagement.primaryProviderId) providerIds.add(engagement.primaryProviderId);
    for (const pkg of packages) {
      if (pkg.providerId) providerIds.add(pkg.providerId);
    }
    for (const payout of payouts) {
      providerIds.add(payout.providerId);
    }

    if (isYtd) {
      for (const providerId of Array.from(providerIds)) {
        let row = providerYtd.get(providerId);
        if (!row) {
          row = { engagementKeys: new Set(), clientFeeCents: 0, doulaPayoutCents: 0 };
          providerYtd.set(providerId, row);
        }
        row.engagementKeys.add(ref);
      }
      for (const pkg of packages) {
        if (!pkg.providerId) continue;
        const row = providerYtd.get(pkg.providerId);
        if (row) row.clientFeeCents += pkg.clientFeeCents;
      }
      for (const payout of payouts) {
        const row = providerYtd.get(payout.providerId);
        if (row) row.doulaPayoutCents += payout.amountCents;
      }
    }
  }

  const activeClients = clients.filter(
    (c) => c.status === "active" && !c.archivedAt
  ).length;

  const activeLeads = leads.filter((l) => !l.archivedAt);
  const byLeadStatus: Partial<Record<LeadStatus, number>> = {};
  let consultScheduled = 0;
  let converted = 0;
  let lost = 0;
  let newThisMonth = 0;

  for (const lead of activeLeads) {
    byLeadStatus[lead.status] = (byLeadStatus[lead.status] ?? 0) + 1;
    if (lead.status === "consult_scheduled") consultScheduled += 1;
    if (CONVERTED_STATUSES.includes(lead.status)) converted += 1;
    if (lead.status === "lost") lost += 1;
    if (lead.createdAt >= monthStart) newThisMonth += 1;

    const leadMonth = monthKey(lead.createdAt);
    if (leadMonth && monthlyLeadMap.has(leadMonth)) {
      monthlyLeadMap.set(leadMonth, (monthlyLeadMap.get(leadMonth) ?? 0) + 1);
    }
  }

  const funnelDenominator = activeLeads.filter(
    (l) => l.status !== "lost" && l.status !== "stale"
  ).length;
  const conversionRate =
    funnelDenominator > 0 ? Math.round((converted / funnelDenominator) * 1000) / 10 : null;

  const topProviders = Array.from(providerYtd.entries())
    .map(([providerId, stats]) => ({
      providerId,
      displayName: providerNames.get(providerId) ?? providerId,
      engagementCount: stats.engagementKeys.size,
      ytdClientFeeCents: stats.clientFeeCents,
      ytdDoulaPayoutCents: stats.doulaPayoutCents,
    }))
    .sort((a, b) => b.ytdClientFeeCents - a.ytdClientFeeCents)
    .slice(0, 10);

  const monthlyLeads: DashboardMonthlyCount[] = lastMonths.map((month) => ({
    month,
    count: monthlyLeadMap.get(month) ?? 0,
  }));

  const monthlyEngagementBookings: DashboardMonthlyCount[] = lastMonths.map((month) => ({
    month,
    count: monthlyBookingMap.get(month) ?? 0,
  }));

  const byYear = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  return {
    generatedAt: new Date().toISOString(),
    year,
    summary: {
      totalEngagements,
      historicEngagements,
      liveEngagements,
      totalClients: clients.length,
      activeClients,
      ytdEngagementCount,
      ytdClientFeeCents,
      ytdDoulaPayoutCents,
      ytdMarginCents: ytdClientFeeCents - ytdDoulaPayoutCents,
      upcomingEngagements,
      completedEngagements,
      cancelledEngagements,
    },
    byYear,
    byServiceType,
    byStatus,
    leads: {
      total: leads.length,
      active: activeLeads.length,
      byStatus: byLeadStatus,
      consultScheduled,
      converted,
      lost,
      newThisMonth,
      conversionRate,
    },
    monthlyLeads,
    monthlyEngagementBookings,
    topProviders,
  };
};
