import { loadCrmStorageIndex } from "@/lib/clients/crmIndexLoader";
import { computeEngagementAnalyticsCore } from "@/lib/dashboard/engagementAnalyticsCore";
import { listAllLeads } from "@/lib/leads/storage";
import { listProviders } from "@/lib/providers/storage";
import type {
  DashboardEngagementAnalytics,
  DashboardEngagementAnalyticsCore,
  DashboardLeadAnalytics,
  DashboardTopProvider,
  DashboardYearBucket,
} from "@/types/dashboard";
import type { LeadStatus } from "@/types/lead";

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

const CONVERTED_STATUSES: LeadStatus[] = [
  "converted",
  "converted_to_member",
  "under_contract",
];

const LEAD_CACHE_TTL_MS = 5 * 60 * 1000;
const ENGAGEMENT_CORE_CACHE_TTL_MS = 5 * 60 * 1000;

let leadAnalyticsCache: { expiresAt: number; data: DashboardLeadAnalytics } | null =
  null;
let engagementCoreCache: {
  expiresAt: number;
  data: DashboardEngagementAnalyticsCore;
} | null = null;

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

export const computeDashboardLeadAnalytics = async (options?: {
  force?: boolean;
}): Promise<DashboardLeadAnalytics> => {
  if (
    !options?.force &&
    leadAnalyticsCache &&
    leadAnalyticsCache.expiresAt > Date.now()
  ) {
    return leadAnalyticsCache.data;
  }

  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonths = buildLastMonths(12);
  const monthlyLeadMap = new Map(lastMonths.map((m) => [m, 0]));
  const monthlyLeadsHistoryMap = new Map<string, number>();

  const leads = await listAllLeads();
  const activeLeads = leads.filter((lead) => !lead.archivedAt);
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
    if (leadMonth) {
      if (monthlyLeadMap.has(leadMonth)) {
        monthlyLeadMap.set(leadMonth, (monthlyLeadMap.get(leadMonth) ?? 0) + 1);
      }
      monthlyLeadsHistoryMap.set(
        leadMonth,
        (monthlyLeadsHistoryMap.get(leadMonth) ?? 0) + 1
      );
    }
  }

  const funnelDenominator = activeLeads.filter(
    (lead) => lead.status !== "lost" && lead.status !== "stale"
  ).length;
  const conversionRate =
    funnelDenominator > 0 ? Math.round((converted / funnelDenominator) * 1000) / 10 : null;

  const data: DashboardLeadAnalytics = {
    generatedAt: new Date().toISOString(),
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
    monthlyLeads: lastMonths.map((month) => ({
      month,
      count: monthlyLeadMap.get(month) ?? 0,
    })),
    monthlyLeadsHistory: Array.from(monthlyLeadsHistoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
  };

  leadAnalyticsCache = {
    expiresAt: Date.now() + LEAD_CACHE_TTL_MS,
    data,
  };

  return data;
};

export const computeDashboardEngagementAnalyticsCore = async (options?: {
  force?: boolean;
}): Promise<DashboardEngagementAnalyticsCore> => {
  if (
    !options?.force &&
    engagementCoreCache &&
    engagementCoreCache.expiresAt > Date.now()
  ) {
    return engagementCoreCache.data;
  }

  const [crmIndex, providers] = await Promise.all([
    loadCrmStorageIndex({ force: options?.force }),
    listProviders({ includeArchived: true }),
  ]);

  const data = computeEngagementAnalyticsCore(crmIndex, providers);
  engagementCoreCache = {
    expiresAt: Date.now() + ENGAGEMENT_CORE_CACHE_TTL_MS,
    data,
  };

  return data;
};

export const computeDashboardEngagementAnalytics = async (
  year = new Date().getFullYear(),
  options?: { force?: boolean }
): Promise<DashboardEngagementAnalytics> => {
  const core = await computeDashboardEngagementAnalyticsCore(options);
  return withSelectedYear(core, year);
};
