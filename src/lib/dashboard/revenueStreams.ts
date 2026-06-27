import type { EngagementServiceType } from "@/types/serviceEngagement";
import type {
  DashboardMonthlyRevenue,
  DashboardYearBucket,
} from "@/types/dashboard";

export type RevenueStreamKey = "birth" | "postpartum" | "other";

export const REVENUE_STREAMS: {
  key: RevenueStreamKey;
  label: string;
  colorClass: string;
}[] = [
  { key: "birth", label: "Birth", colorClass: "bg-nurture-sage" },
  { key: "postpartum", label: "Postpartum", colorClass: "bg-nurture-sage-dark" },
  { key: "other", label: "Other", colorClass: "bg-nurture-charcoal/40" },
];

export const streamClientFeeCents = (
  row: Pick<
    DashboardYearBucket,
    "birthClientFeeCents" | "postpartumClientFeeCents" | "otherClientFeeCents"
  >,
  stream: RevenueStreamKey
): number => {
  if (stream === "birth") return row.birthClientFeeCents;
  if (stream === "postpartum") return row.postpartumClientFeeCents;
  return row.otherClientFeeCents;
};

export const streamEngagementCount = (
  row: Pick<DashboardYearBucket, "birthCount" | "postpartumCount" | "otherCount">,
  stream: RevenueStreamKey
): number => {
  if (stream === "birth") return row.birthCount;
  if (stream === "postpartum") return row.postpartumCount;
  return row.otherCount;
};

export const streamMonthlyClientFeeCents = (
  row: Pick<
    DashboardMonthlyRevenue,
    "birthClientFeeCents" | "postpartumClientFeeCents" | "otherClientFeeCents"
  >,
  stream: RevenueStreamKey
): number => streamClientFeeCents(row, stream);

export const streamMonthlyEngagementCount = (
  row: Pick<DashboardMonthlyRevenue, "birthCount" | "postpartumCount" | "otherCount">,
  stream: RevenueStreamKey
): number => streamEngagementCount(row, stream);

export const addEngagementToStreamTotals = (
  serviceType: EngagementServiceType,
  clientFeeCents: number,
  doulaPayoutCents: number,
  target: {
    birthCount: number;
    postpartumCount: number;
    otherCount: number;
    birthClientFeeCents: number;
    postpartumClientFeeCents: number;
    otherClientFeeCents: number;
    birthDoulaPayoutCents: number;
    postpartumDoulaPayoutCents: number;
    otherDoulaPayoutCents: number;
  }
): void => {
  if (serviceType === "birth") {
    target.birthCount += 1;
    target.birthClientFeeCents += clientFeeCents;
    target.birthDoulaPayoutCents += doulaPayoutCents;
    return;
  }
  if (serviceType === "postpartum") {
    target.postpartumCount += 1;
    target.postpartumClientFeeCents += clientFeeCents;
    target.postpartumDoulaPayoutCents += doulaPayoutCents;
    return;
  }
  target.otherCount += 1;
  target.otherClientFeeCents += clientFeeCents;
  target.otherDoulaPayoutCents += doulaPayoutCents;
};

export const emptyStreamTotals = () => ({
  birthCount: 0,
  postpartumCount: 0,
  otherCount: 0,
  birthClientFeeCents: 0,
  postpartumClientFeeCents: 0,
  otherClientFeeCents: 0,
  birthDoulaPayoutCents: 0,
  postpartumDoulaPayoutCents: 0,
  otherDoulaPayoutCents: 0,
});
