"use client";

import {
  assignCohorts,
  fetchCohortRecommendations,
  fetchCohorts,
  fetchMyCohorts,
  joinCohort,
  patchCommunityProfileMetadata,
  type CohortMembershipSummary,
  type CohortRecommendation,
  type CohortSummary,
} from "@/lib/api/communityCohortsApi";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const communityListPath = "/apps/community";
const MEMBER_INTAKE_PATH = "/apps/dashboard/intake";

function formatCohortType(type: string): string {
  return type.replace(/_/g, " ");
}

function isCohortsFeatureDisabled(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("feature disabled") ||
    lower.includes("enable_cohorts") ||
    message.includes("503")
  );
}

function CohortRow({
  name,
  type,
  hint,
  actionLabel,
  busy,
  onAction,
}: {
  name: string;
  type: string;
  hint?: string;
  actionLabel: string;
  busy: boolean;
  onAction: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-nurture-sage/10 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-nurture-charcoal">{name}</p>
        <p className="text-[11px] capitalize text-nurture-charcoal/45">
          {formatCohortType(type)}
          {hint ? ` · ${hint}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={busy}
        className="shrink-0 rounded-full border border-nurture-sage/40 px-3 py-1 text-[11px] font-semibold text-nurture-sage-dark hover:bg-nurture-cream disabled:opacity-50"
      >
        {busy ? "…" : actionLabel}
      </button>
    </li>
  );
}

export function CohortRecommendations() {
  const [recommendations, setRecommendations] = useState<CohortRecommendation[]>(
    []
  );
  const [browseCohorts, setBrowseCohorts] = useState<CohortSummary[]>([]);
  const [memberships, setMemberships] = useState<CohortMembershipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(false);
    try {
      const [recs, mine, all] = await Promise.all([
        fetchCohortRecommendations(),
        fetchMyCohorts(),
        fetchCohorts(),
      ]);
      setRecommendations(recs.recommendations);
      setMemberships(mine.results);
      const joined = new Set(mine.results.map((m) => m.cohort_id));
      setBrowseCohorts(
        all.results.filter((c) => c.is_active && !joined.has(c.cohort_id))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load cohorts";
      if (isCohortsFeatureDisabled(message)) {
        setDisabled(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleJoin = async (cohortId: string) => {
    setBusyId(cohortId);
    setError(null);
    try {
      await joinCohort(cohortId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleMatchByDueDate = async () => {
    if (!dueDate.trim()) {
      setError("Enter your due date to get a personalized match.");
      return;
    }
    setAssigning(true);
    setError(null);
    try {
      await patchCommunityProfileMetadata({ due_date: dueDate.trim().slice(0, 10) });
      const { assigned } = await assignCohorts(false);
      await load();
      if (assigned.length === 0) {
        setError(
          "No group matched that due date yet — join one from the list below."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not match");
    } finally {
      setAssigning(false);
    }
  };

  if (disabled) {
    return null;
  }

  if (loading) {
    return (
      <section className="mt-10 border-t border-nurture-sage/15 pt-8">
        <p className="text-xs text-nurture-charcoal/50">Loading peer groups…</p>
      </section>
    );
  }

  const showBrowse =
    browseCohorts.length > 0 &&
    recommendations.length === 0;

  return (
    <section className="mt-10 border-t border-nurture-sage/15 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Peer groups
          </h2>
          <p className="mt-0.5 text-xs text-nurture-charcoal/55">
            Time-based circles that link you to the right community
          </p>
        </div>
        {memberships.length > 0 ? (
          <span className="text-[11px] font-medium text-nurture-sage-dark">
            {memberships.length} joined
          </span>
        ) : null}
      </div>

      {memberships.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {memberships.map((m) =>
            m.linked_community_id ? (
              <Link
                key={m.membership_id}
                href={`${communityListPath}/${m.linked_community_id}`}
                className="rounded-full bg-nurture-sage/10 px-2.5 py-0.5 text-[11px] font-medium text-nurture-sage-dark hover:bg-nurture-sage/20"
              >
                {m.name}
              </Link>
            ) : (
              <span
                key={m.membership_id}
                className="rounded-full bg-nurture-cream px-2.5 py-0.5 text-[11px] text-nurture-charcoal/70"
              >
                {m.name}
              </span>
            )
          )}
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-nurture-sage/15 bg-white/80 px-3 py-3 sm:px-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-nurture-sage-dark">
          Match by due date
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-nurture-sage/25 px-2.5 py-1.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            aria-label="Due date"
          />
          <button
            type="button"
            onClick={() => void handleMatchByDueDate()}
            disabled={assigning}
            className="rounded-full bg-nurture-sage px-3 py-1.5 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
          >
            {assigning ? "Matching…" : "Match me"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-nurture-charcoal/50">
          Or pick a group below. Full profile intake is at{" "}
          <Link
            href={MEMBER_INTAKE_PATH}
            className="font-medium text-nurture-sage-dark underline-offset-2 hover:underline"
          >
            member intake
          </Link>
          .
        </p>
      </div>

      {recommendations.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-nurture-charcoal">
            Recommended
          </p>
          <ul className="mt-1 rounded-xl border border-nurture-sage/15 bg-white px-3 sm:px-4">
            {recommendations.map((rec) => (
              <CohortRow
                key={rec.cohort_id}
                name={rec.name}
                type={rec.cohort_type}
                hint={rec.reason}
                actionLabel="Join"
                busy={busyId === rec.cohort_id}
                onAction={() => void handleJoin(rec.cohort_id)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {showBrowse || browseCohorts.length > 0 ? (
        <details
          className="mt-4 group"
          open={recommendations.length === 0 && memberships.length === 0}
        >
          <summary className="cursor-pointer list-none text-xs font-semibold text-nurture-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-nurture-sage-dark transition group-open:rotate-90">
                ▸
              </span>
              All peer groups
              <span className="font-normal text-nurture-charcoal/45">
                ({browseCohorts.length})
              </span>
            </span>
          </summary>
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-nurture-sage/15 bg-white px-3 sm:px-4">
            {browseCohorts.map((cohort) => (
              <CohortRow
                key={cohort.cohort_id}
                name={cohort.name}
                type={cohort.cohort_type}
                actionLabel="Join"
                busy={busyId === cohort.cohort_id}
                onAction={() => void handleJoin(cohort.cohort_id)}
              />
            ))}
          </ul>
        </details>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
