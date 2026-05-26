"use client";

import {
  MATERNAL_STAGE_LABELS,
  SUPPORT_INTEREST_LABELS,
} from "@/content/intake";
import { fetchAdminIntakes, updateAdminIntakeStatus } from "@/lib/api/intakeClient";
import type {
  CareRecommendation,
  IntakeProfile,
  IntakeStatus,
  MaternalStage,
  SupportInterest,
} from "@/types/intake";
import { INTAKE_STATUSES } from "@/types/intake";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type StatusFilter = "all" | IntakeStatus;

const STATUS_LABELS: Record<IntakeStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "in-review": "In review",
};

const statusBadgeClass = (status: IntakeStatus) => {
  switch (status) {
    case "submitted":
      return "bg-nurture-sage/15 text-nurture-sage-dark";
    case "in-review":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface IntakeQueueProps {
  userEmail: string;
}

const IntakeQueue = ({ userEmail }: IntakeQueueProps) => {
  const [profiles, setProfiles] = useState<IntakeProfile[]>([]);
  const [recommendations, setRecommendations] = useState<CareRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminIntakes();
      setProfiles(data.profiles);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load intakes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (
    profileId: string,
    intakeStatus: IntakeStatus
  ) => {
    setStatusSavingId(profileId);
    try {
      await updateAdminIntakeStatus(profileId, intakeStatus);
      await load();
      toast.success(`Status updated to ${STATUS_LABELS[intakeStatus]}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update status"
      );
    } finally {
      setStatusSavingId(null);
    }
  };

  const recommendationsByUser = useMemo(() => {
    const map = new Map<string, CareRecommendation[]>();
    for (const item of recommendations) {
      const list = map.get(item.userId) ?? [];
      list.push(item);
      map.set(item.userId, list);
    }
    return map;
  }, [recommendations]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      if (statusFilter !== "all" && profile.intakeStatus !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        profile.name.toLowerCase().includes(query) ||
        profile.email.toLowerCase().includes(query) ||
        profile.phone.toLowerCase().includes(query) ||
        profile.locationZip.toLowerCase().includes(query)
      );
    });
  }, [profiles, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: profiles.length,
      draft: profiles.filter((p) => p.intakeStatus === "draft").length,
      submitted: profiles.filter((p) => p.intakeStatus === "submitted").length,
      "in-review": profiles.filter((p) => p.intakeStatus === "in-review")
        .length,
    }),
    [profiles]
  );

  if (loading) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading intake queue…</p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
        <button
          type="button"
          onClick={load}
          className="ml-3 font-semibold underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Intake queue
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Review member onboarding submissions and in-progress drafts.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search name, email, phone, ZIP…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "submitted", "draft", "in-review"] as StatusFilter[]).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === filter
                    ? "bg-nurture-sage text-white"
                    : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
                }`}
              >
                {filter === "all" ? "All" : STATUS_LABELS[filter]}{" "}
                <span className="opacity-75">({counts[filter]})</span>
              </button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-nurture-sage/25 bg-nurture-cream/40 p-10 text-center">
          <p className="font-medium text-nurture-charcoal">No intakes found</p>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            {profiles.length === 0
              ? "Member intake submissions will appear here."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((profile) => {
            const expanded = expandedId === profile.id;
            const userRecs = recommendationsByUser.get(profile.userId) ?? [];
            const stageLabel = profile.maternalStage
              ? MATERNAL_STAGE_LABELS[profile.maternalStage as MaternalStage]
              : "—";

            return (
              <div
                key={profile.id}
                className="overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : profile.id)
                  }
                  className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-nurture-charcoal">
                        {profile.name || "Unnamed member"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(profile.intakeStatus)}`}
                      >
                        {STATUS_LABELS[profile.intakeStatus]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-nurture-charcoal/65">
                      {profile.email}
                      {profile.phone ? ` · ${profile.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm text-nurture-charcoal/60">
                    <span>{stageLabel}</span>
                    <span>{formatDate(profile.updatedAt)}</span>
                    <span aria-hidden>{expanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-nurture-sage/10 bg-nurture-cream/30 px-5 py-5">
                    <div className="mb-5 rounded-xl border border-nurture-sage/15 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                        Update status
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {INTAKE_STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={statusSavingId === profile.id}
                            onClick={() => handleStatusChange(profile.id, status)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                              profile.intakeStatus === status
                                ? "bg-nurture-sage text-white shadow-sm"
                                : "border border-nurture-sage/25 bg-nurture-cream/50 text-nurture-charcoal/75 hover:border-nurture-sage/50"
                            }`}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                      {statusSavingId === profile.id ? (
                        <p className="mt-2 text-xs text-nurture-charcoal/50">
                          Saving…
                        </p>
                      ) : null}
                    </div>

                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailItem label="User ID" value={profile.userId} />
                      <DetailItem label="Stage" value={stageLabel} />
                      <DetailItem
                        label="Support interests"
                        value={
                          profile.supportInterests.length
                            ? profile.supportInterests
                                .map(
                                  (item) =>
                                    SUPPORT_INTEREST_LABELS[
                                      item as SupportInterest
                                    ] ?? item
                                )
                                .join(", ")
                            : "—"
                        }
                      />
                      <DetailItem
                        label="Location ZIP"
                        value={profile.locationZip || "—"}
                      />
                      <DetailItem
                        label="Challenges"
                        value={
                          profile.challenges.length
                            ? profile.challenges.join(", ")
                            : profile.challengesFreeText || "—"
                        }
                      />
                      <DetailItem
                        label="Insurance"
                        value={
                          profile.insuranceProvider ||
                          (profile.insuranceInterested === true
                            ? "Interested in coverage"
                            : profile.insuranceInterested === false
                              ? "Not using insurance"
                              : "—")
                        }
                      />
                      <DetailItem
                        label="Budget"
                        value={profile.budgetPreference ?? "—"}
                      />
                      <DetailItem
                        label="Schedule"
                        value={[
                          profile.preferredSchedule.days.join(", ") || null,
                          profile.preferredSchedule.times.join(", ") || null,
                          profile.preferredSchedule.modality,
                          profile.preferredSchedule.timezone,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      />
                      <DetailItem
                        label="Created"
                        value={formatDate(profile.createdAt)}
                      />
                      <DetailItem
                        label="Last updated"
                        value={formatDate(profile.updatedAt)}
                      />
                    </dl>

                    {profile.challengesFreeText ? (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                          Free text
                        </p>
                        <p className="mt-2 text-sm text-nurture-charcoal/80">
                          {profile.challengesFreeText}
                        </p>
                      </div>
                    ) : null}

                    {userRecs.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                          Recommendations
                        </p>
                        <ul className="mt-2 space-y-2">
                          {userRecs.map((rec) => (
                            <li
                              key={rec.id}
                              className="rounded-xl bg-white p-3 text-sm"
                            >
                              <span className="font-medium">
                                {SUPPORT_INTEREST_LABELS[
                                  rec.recommendationType as SupportInterest
                                ] ?? rec.recommendationType}
                              </span>
                              <span className="text-nurture-charcoal/50">
                                {" "}
                                · P{rec.priorityLevel}
                              </span>
                              <p className="mt-1 text-nurture-charcoal/70">
                                {rec.recommendationReason}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {profile.email === userEmail ? (
                      <p className="mt-4 text-xs text-nurture-charcoal/45">
                        This is your account.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/45">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-nurture-charcoal/80">{value}</dd>
  </div>
);

export default IntakeQueue;
