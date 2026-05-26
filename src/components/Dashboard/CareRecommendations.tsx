import { buildCareStartHref } from "@/config/carePaths";
import { SUPPORT_INTEREST_LABELS } from "@/content/intake";
import type { CareRecommendation, SupportInterest } from "@/types/intake";
import Link from "next/link";

interface CareRecommendationsProps {
  recommendations: CareRecommendation[];
}

const priorityLabel = (level: 1 | 2 | 3) => {
  if (level === 1) return "Top priority";
  if (level === 2) return "Recommended";
  return "Consider";
};

const CareRecommendations = ({ recommendations }: CareRecommendationsProps) => {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-nurture-blush/40 bg-nurture-cream/50 p-6">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Recommended services
        </h3>
        <p className="mt-2 text-sm text-nurture-charcoal/70">
          Complete your intake to receive personalized care recommendations.
        </p>
        <Link
          href={buildCareStartHref()}
          className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
        >
          Start intake →
        </Link>
      </div>
    );
  }

  const sorted = [...recommendations].sort(
    (a, b) => a.priorityLevel - b.priorityLevel
  );

  return (
    <div className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
        Recommended for you
      </h3>
      <p className="mt-1 text-sm text-nurture-charcoal/60">
        Based on your intake, here&apos;s where we suggest starting.
      </p>
      <ul className="mt-5 space-y-4">
        {sorted.map((item) => {
          const label =
            SUPPORT_INTEREST_LABELS[
              item.recommendationType as SupportInterest
            ] ?? item.recommendationType;

          return (
            <li
              key={item.id}
              className="rounded-xl border border-nurture-blush/30 bg-nurture-cream/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-nurture-charcoal">{label}</p>
                <span className="shrink-0 rounded-full bg-nurture-sage/15 px-2.5 py-0.5 text-xs font-medium text-nurture-sage-dark">
                  {priorityLabel(item.priorityLevel)}
                </span>
              </div>
              <p className="mt-2 text-sm text-nurture-charcoal/70">
                {item.recommendationReason}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CareRecommendations;
