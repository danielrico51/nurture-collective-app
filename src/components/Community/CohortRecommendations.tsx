"use client";

import {
  assignCohorts,
  fetchCohortRecommendations,
  fetchMyCohorts,
  joinCohort,
  type CohortMembershipSummary,
  type CohortRecommendation,
} from "@/lib/api/communityCohortsApi";
import { isCommunityServiceConfigured } from "@/lib/community/config";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const communityListPath = "/apps/community";

export function CohortRecommendations() {
  const [recommendations, setRecommendations] = useState<CohortRecommendation[]>(
    []
  );
  const [memberships, setMemberships] = useState<CohortMembershipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const load = useCallback(async () => {
    if (!isCommunityServiceConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [recs, mine] = await Promise.all([
        fetchCohortRecommendations(),
        fetchMyCohorts(),
      ]);
      setRecommendations(recs.recommendations);
      setMemberships(mine.results);
      setDisabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load cohorts";
      if (message.toLowerCase().includes("disabled") || message.includes("503")) {
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

  const handleAutoAssign = async () => {
    setAssigning(true);
    setError(null);
    try {
      await assignCohorts(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (!isCommunityServiceConfigured() || disabled) {
    return null;
  }

  if (loading) {
    return (
      <p className="text-sm text-nurture-charcoal/55">Loading your cohort matches…</p>
    );
  }

  const hasContent = memberships.length > 0 || recommendations.length > 0;

  if (!hasContent && !error) {
    return (
      <div className="rounded-2xl border border-nurture-sage/15 bg-white px-5 py-4">
        <h3 className="text-sm font-semibold text-nurture-charcoal">
          Your peer groups
        </h3>
        <p className="mt-2 text-sm text-nurture-charcoal/65">
          Add your due date or postpartum timing in intake, then we can match you
          to moms in the same season.
        </p>
        <button
          type="button"
          onClick={() => void handleAutoAssign()}
          disabled={assigning}
          className="mt-3 rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {assigning ? "Matching…" : "Find my cohorts"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memberships.length > 0 ? (
        <div className="rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 px-5 py-4">
          <h3 className="text-sm font-semibold text-nurture-charcoal">
            Your cohorts
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {memberships.map((m) => (
              <li key={m.membership_id}>
                {m.linked_community_id ? (
                  <Link
                    href={`${communityListPath}/${m.linked_community_id}`}
                    className="inline-flex rounded-full border border-nurture-sage/30 bg-white px-3 py-1 text-xs font-medium text-nurture-sage-dark hover:bg-white/90"
                  >
                    {m.name}
                  </Link>
                ) : (
                  <span className="inline-flex rounded-full border border-nurture-sage/20 bg-white px-3 py-1 text-xs font-medium text-nurture-charcoal/80">
                    {m.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="rounded-2xl border border-nurture-sage/15 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-nurture-charcoal">
              Recommended for you
            </h3>
            <button
              type="button"
              onClick={() => void handleAutoAssign()}
              disabled={assigning}
              className="text-xs font-medium text-nurture-sage-dark hover:underline disabled:opacity-60"
            >
              {assigning ? "Matching…" : "Auto-match"}
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {recommendations.map((rec) => (
              <li
                key={rec.cohort_id}
                className="flex flex-col gap-2 rounded-xl border border-nurture-sage/10 bg-nurture-cream/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-nurture-charcoal">
                    {rec.name}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-nurture-charcoal/50">
                    {rec.cohort_type.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-nurture-charcoal/60">
                    {rec.reason}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleJoin(rec.cohort_id)}
                  disabled={busyId === rec.cohort_id}
                  className="shrink-0 rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
                >
                  {busyId === rec.cohort_id ? "Joining…" : "Join cohort"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
