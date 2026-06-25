import type { EngagementServiceType, EngagementStatus } from "@/types/serviceEngagement";
import type { LeadStatus } from "@/types/lead";

export interface DashboardYearBucket {
  year: number;
  engagementCount: number;
  clientFeeCents: number;
  doulaPayoutCents: number;
  birthCount: number;
  postpartumCount: number;
}

export interface DashboardMonthlyCount {
  month: string;
  count: number;
}

export interface DashboardMonthlyRevenue {
  month: string;
  engagementCount: number;
  clientFeeCents: number;
  doulaPayoutCents: number;
  marginCents: number;
}

export interface DashboardYoyRow {
  year: number;
  engagementCount: number;
  engagementCountYoyPct: number | null;
  clientFeeCents: number;
  clientFeeCentsYoyPct: number | null;
  doulaPayoutCents: number;
  marginCents: number;
  marginYoyPct: number | null;
  avgRevenuePerJobCents: number;
}

export interface DashboardTopProvider {
  providerId: string;
  displayName: string;
  engagementCount: number;
  ytdClientFeeCents: number;
  ytdDoulaPayoutCents: number;
}

export interface DashboardLeadAnalytics {
  generatedAt: string;
  leads: {
    total: number;
    active: number;
    byStatus: Partial<Record<LeadStatus, number>>;
    consultScheduled: number;
    converted: number;
    lost: number;
    newThisMonth: number;
    conversionRate: number | null;
  };
  monthlyLeads: DashboardMonthlyCount[];
  /** All created-at months with counts (sorted ascending). */
  monthlyLeadsHistory: DashboardMonthlyCount[];
}

export interface DashboardEngagementAnalytics {
  generatedAt: string;
  year: number;
  indexLoadedAt: string;
  summary: {
    totalEngagements: number;
    historicEngagements: number;
    liveEngagements: number;
    totalClients: number;
    activeClients: number;
    ytdEngagementCount: number;
    ytdClientFeeCents: number;
    ytdDoulaPayoutCents: number;
    ytdMarginCents: number;
    upcomingEngagements: number;
    completedEngagements: number;
    cancelledEngagements: number;
  };
  byYear: DashboardYearBucket[];
  byServiceType: Record<
    EngagementServiceType,
    { count: number; clientFeeCents: number }
  >;
  byStatus: Record<EngagementStatus, number>;
  monthlyEngagementBookings: DashboardMonthlyCount[];
  monthlyBookingsHistory: DashboardMonthlyCount[];
  monthlyRevenueHistory: DashboardMonthlyRevenue[];
  yoyByYear: DashboardYoyRow[];
  topProviders: DashboardTopProvider[];
}

/** @deprecated Combined payload — prefer split lead + engagement endpoints. */
export interface DashboardAnalytics {
  generatedAt: string;
  year: number;
  summary: {
    totalEngagements: number;
    historicEngagements: number;
    liveEngagements: number;
    totalClients: number;
    activeClients: number;
    ytdEngagementCount: number;
    ytdClientFeeCents: number;
    ytdDoulaPayoutCents: number;
    ytdMarginCents: number;
    upcomingEngagements: number;
    completedEngagements: number;
    cancelledEngagements: number;
  };
  byYear: DashboardYearBucket[];
  byServiceType: Record<
    EngagementServiceType,
    { count: number; clientFeeCents: number }
  >;
  byStatus: Record<EngagementStatus, number>;
  leads: {
    total: number;
    active: number;
    byStatus: Partial<Record<LeadStatus, number>>;
    consultScheduled: number;
    converted: number;
    lost: number;
    newThisMonth: number;
    conversionRate: number | null;
  };
  monthlyLeads: DashboardMonthlyCount[];
  monthlyEngagementBookings: DashboardMonthlyCount[];
  topProviders: DashboardTopProvider[];
}

export interface DashboardAnalyticsResponse {
  analytics: DashboardAnalytics;
  storage: {
    clients: string;
    leads: string;
  };
}
