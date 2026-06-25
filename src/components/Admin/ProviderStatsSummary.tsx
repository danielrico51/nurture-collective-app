import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import type { ProviderStats } from "@/types/provider";

export const formatProviderMoney = formatEngagementMoney;

interface ProviderStatsSummaryProps {
  stats: ProviderStats;
  year: number;
  compact?: boolean;
}

const ProviderStatsSummary = ({
  stats,
  year,
  compact = false,
}: ProviderStatsSummaryProps) => {
  if (compact) {
    return (
      <p className="mt-1 text-xs text-nurture-charcoal/55">
        {stats.engagementCount} job{stats.engagementCount === 1 ? "" : "s"}
        {" · "}
        YTD {formatProviderMoney(stats.ytdClientFeeCents)} client
        {" · "}
        {formatProviderMoney(stats.ytdDoulaPayoutCents)} doula
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-nurture-sage/15 bg-white/90 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
          Total jobs
        </p>
        <p className="mt-1 text-2xl font-semibold text-nurture-charcoal">
          {stats.engagementCount}
        </p>
        <p className="mt-1 text-xs text-nurture-charcoal/50">
          {stats.primaryEngagementCount} as primary doula
        </p>
      </div>
      <div className="rounded-xl border border-nurture-sage/15 bg-white/90 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
          Lifetime client revenue
        </p>
        <p className="mt-1 text-2xl font-semibold text-nurture-charcoal">
          {formatProviderMoney(stats.lifetimeClientFeeCents)}
        </p>
        <p className="mt-1 text-xs text-nurture-charcoal/50">
          Package fees attributed to this provider
        </p>
      </div>
      <div className="rounded-xl border border-nurture-sage/15 bg-white/90 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
          Lifetime doula payouts
        </p>
        <p className="mt-1 text-2xl font-semibold text-nurture-charcoal">
          {formatProviderMoney(stats.lifetimeDoulaPayoutCents)}
        </p>
        <p className="mt-1 text-xs text-nurture-charcoal/50">
          Payout batches assigned to this provider
        </p>
      </div>
      <div className="rounded-xl border border-nurture-sage/15 bg-nurture-sage/5 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-nurture-charcoal/45">
          {year} YTD
        </p>
        <p className="mt-1 text-2xl font-semibold text-nurture-charcoal">
          {stats.ytdEngagementCount} jobs
        </p>
        <p className="mt-1 text-xs text-nurture-charcoal/50">
          {formatProviderMoney(stats.ytdClientFeeCents)} client ·{" "}
          {formatProviderMoney(stats.ytdDoulaPayoutCents)} doula
        </p>
      </div>
    </div>
  );
};

export default ProviderStatsSummary;
