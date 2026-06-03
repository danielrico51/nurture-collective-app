"use client";

import {
  assignCohorts,
  fetchCohortRecommendations,
  fetchCohorts,
  fetchCommunityUserProfile,
  fetchMyCohorts,
  joinCohort,
  patchCommunityProfileMetadata,
  type CohortMembershipSummary,
  type CohortRecommendation,
  type CohortSummary,
} from "@/lib/api/communityCohortsApi";
import { runWithAutoRetry } from "@/lib/api/fetchWithRetry";
import {
  buildJourneyMetadata,
  JOURNEY_PATH_OPTIONS,
  JOURNEY_STAGE_OPTIONS,
  journeyFieldsFromMetadata,
  type JourneyPath,
} from "@/lib/community/journeyStages";
import type { MaternalStage } from "@/types/intake";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const communityListPath = "/apps/community";
const JOURNAL_PATH = "/apps/journal";

const selectClassName =
  "w-full rounded-lg border border-nurture-sage/25 bg-white px-2.5 py-1.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

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
  const [stage, setStage] = useState<MaternalStage | "">("");
  const [journeyPath, setJourneyPath] = useState<JourneyPath | "">("");
  const [dueDate, setDueDate] = useState("");
  const [postpartumWeeks, setPostpartumWeeks] = useState("");
  const [babyAgeWeeks, setBabyAgeWeeks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(false);
    try {
      const [recs, mine, all, profile] = await runWithAutoRetry(() =>
        Promise.all([
          fetchCohortRecommendations(),
          fetchMyCohorts(),
          fetchCohorts(),
          fetchCommunityUserProfile().catch(() => null),
        ])
      );
      setRecommendations(recs.recommendations);
      setMemberships(mine.results);
      const joined = new Set(mine.results.map((m) => m.cohort_id));
      setBrowseCohorts(
        all.results.filter((c) => c.is_active && !joined.has(c.cohort_id))
      );
      if (profile?.profile_metadata) {
        const fields = journeyFieldsFromMetadata(profile.profile_metadata);
        setStage(fields.stage);
        setJourneyPath(fields.journeyPath);
        setDueDate(fields.dueDate);
        setPostpartumWeeks(fields.postpartumWeeks);
        setBabyAgeWeeks(fields.babyAgeWeeks);
      }
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

  const handleSaveAndMatch = async () => {
    if (!stage) {
      setError("Choose where you are in your journey first.");
      return;
    }
    if (stage === "trying-to-conceive" && !journeyPath) {
      setError("Choose how you’re on your path (TTC, IVF, or other).");
      return;
    }
    if (stage === "pregnant" && !dueDate.trim()) {
      setError(
        "Add a due date or your best estimate — especially helpful after IVF."
      );
      return;
    }
    if (stage === "newly-postpartum" && !postpartumWeeks.trim()) {
      setError("Enter how many weeks it’s been since birth.");
      return;
    }
    if (stage === "infant-care" && !babyAgeWeeks.trim()) {
      setError("Enter your baby’s age in weeks (approximate is fine).");
      return;
    }

    setAssigning(true);
    setError(null);
    try {
      const metadata = buildJourneyMetadata({
        stage,
        journeyPath: journeyPath || undefined,
        dueDate,
        postpartumWeeks,
        babyAgeWeeks,
      });
      await patchCommunityProfileMetadata(metadata);
      const { assigned } = await assignCohorts(false);
      await load();
      if (assigned.length === 0) {
        setError(
          "Saved your journey. No timed group matched yet — join any group below that fits."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setAssigning(false);
    }
  };

  const stageHint = JOURNEY_STAGE_OPTIONS.find((o) => o.value === stage)?.shortHint;

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

  return (
    <section className="mt-10 border-t border-nurture-sage/15 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Peer groups
          </h2>
          <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-nurture-charcoal/55">
            For every mom and future mom — TTC, IVF, pregnant, postpartum, and
            beyond. Set your journey in{" "}
            <Link
              href={JOURNAL_PATH}
              className="font-medium text-nurture-sage-dark underline-offset-2 hover:underline"
            >
              Wellness journal
            </Link>{" "}
            (Journey tab) for matching; quick fields below if you prefer.
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
          Your journey
        </p>
        <p className="mt-1 text-[11px] text-nurture-charcoal/50">
          Quick match only — your full private journey lives in Wellness journal.
        </p>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-nurture-charcoal">
            Where are you now?
          </span>
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value as MaternalStage | "");
              setError(null);
            }}
            className={`${selectClassName} mt-1`}
          >
            <option value="">Select your stage…</option>
            {JOURNEY_STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {stageHint ? (
            <span className="mt-1 block text-[11px] text-nurture-charcoal/45">
              {stageHint}
            </span>
          ) : null}
        </label>

        {stage === "trying-to-conceive" ? (
          <label className="mt-3 block">
            <span className="text-xs font-medium text-nurture-charcoal">
              Your path
            </span>
            <select
              value={journeyPath}
              onChange={(e) => setJourneyPath(e.target.value as JourneyPath | "")}
              className={`${selectClassName} mt-1`}
            >
              <option value="">Select…</option>
              {JOURNEY_PATH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {stage === "pregnant" ? (
          <label className="mt-3 block">
            <span className="text-xs font-medium text-nurture-charcoal">
              Due date or estimated due date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${selectClassName} mt-1`}
            />
            <span className="mt-1 block text-[11px] text-nurture-charcoal/45">
              IVF and other journeys: use your clinic’s estimate — exact date not
              required.
            </span>
          </label>
        ) : null}

        {stage === "newly-postpartum" ? (
          <label className="mt-3 block">
            <span className="text-xs font-medium text-nurture-charcoal">
              Weeks since birth
            </span>
            <input
              type="number"
              min={0}
              max={52}
              value={postpartumWeeks}
              onChange={(e) => setPostpartumWeeks(e.target.value)}
              placeholder="e.g. 6"
              className={`${selectClassName} mt-1`}
            />
          </label>
        ) : null}

        {stage === "infant-care" ? (
          <label className="mt-3 block">
            <span className="text-xs font-medium text-nurture-charcoal">
              Baby&apos;s age (weeks)
            </span>
            <input
              type="number"
              min={0}
              max={52}
              value={babyAgeWeeks}
              onChange={(e) => setBabyAgeWeeks(e.target.value)}
              placeholder="e.g. 12"
              className={`${selectClassName} mt-1`}
            />
          </label>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSaveAndMatch()}
            disabled={assigning || !stage}
            className="rounded-full bg-nurture-sage px-3 py-1.5 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
          >
            {assigning ? "Saving…" : "Save & find my group"}
          </button>
          {(stage === "toddler" || stage === "multiple-children") && (
            <span className="text-[11px] text-nurture-charcoal/50">
              Then browse groups below
            </span>
          )}
        </div>
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

      {browseCohorts.length > 0 ? (
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
