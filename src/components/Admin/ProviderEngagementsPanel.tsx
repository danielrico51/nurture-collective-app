"use client";

import {
  fetchProviderEngagements,
  reallocateProviderEngagement,
} from "@/lib/api/providersClient";
import { formatEngagementMoney } from "@/lib/api/scheduleClient";
import type { ProviderRecord } from "@/types/provider";
import type {
  ProviderEngagementAssignmentRole,
  ProviderEngagementRow,
} from "@/types/serviceEngagement";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ProviderEngagementsPanelProps {
  provider: ProviderRecord;
  providers: ProviderRecord[];
  onChanged: () => void;
}

const ROLE_LABELS: Record<ProviderEngagementAssignmentRole, string> = {
  primary: "Primary doula",
  package: "Package",
  payout: "Payout",
  shift: "Shift",
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const serviceTypeLabel = (value: ProviderEngagementRow["serviceType"]): string => {
  if (value === "birth") return "Birth";
  if (value === "postpartum") return "Postpartum";
  return "Other";
};

const ProviderEngagementsPanel = ({
  provider,
  providers,
  onChanged,
}: ProviderEngagementsPanelProps) => {
  const [rows, setRows] = useState<ProviderEngagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetByEngagement, setTargetByEngagement] = useState<
    Record<string, string>
  >({});
  const [movingEngagementId, setMovingEngagementId] = useState<string | null>(
    null
  );

  const targetOptions = useMemo(
    () =>
      providers
        .filter(
          (item) =>
            item.providerId !== provider.providerId && !item.archivedAt
        )
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [provider.providerId, providers]
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchProviderEngagements(provider.providerId);
      setRows(data.engagements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs");
    } finally {
      setLoading(false);
    }
  }, [provider.providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reallocate = async (row: ProviderEngagementRow) => {
    const targetProviderId = targetByEngagement[row.engagementId]?.trim();
    if (!targetProviderId) {
      toast.error("Choose a provider to reassign to");
      return;
    }

    setMovingEngagementId(row.engagementId);
    try {
      const result = await reallocateProviderEngagement(provider.providerId, {
        clientId: row.clientId,
        engagementId: row.engagementId,
        targetProviderId,
      });
      toast.success(
        `Reassigned ${result.updatedCount} assignment${result.updatedCount === 1 ? "" : "s"}`
      );
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reassign failed");
    } finally {
      setMovingEngagementId(null);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-nurture-sage/20 bg-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Assigned jobs
          </h3>
          <p className="mt-1 text-sm text-nurture-charcoal/60">
            Engagements where {provider.displayName} is the primary doula, on a
            package, payout, or shift. Reassign to fix duplicate provider names
            from spreadsheet imports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark"
        >
          Refresh jobs
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-nurture-charcoal/60">Loading assigned jobs…</p>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">
          No engagements assigned to this provider yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-nurture-sage/15 text-xs uppercase tracking-wide text-nurture-charcoal/50">
                <th className="px-2 py-2 font-medium">Client</th>
                <th className="px-2 py-2 font-medium">Year</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Due / booked</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Fees</th>
                <th className="px-2 py-2 font-medium">Reassign</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.engagementId}
                  className="border-b border-nurture-sage/10 align-top"
                >
                  <td className="px-2 py-3">
                    <div className="font-medium text-nurture-charcoal">
                      {row.clientName}
                    </div>
                    {row.importSource ? (
                      <div className="mt-0.5 text-[11px] text-nurture-charcoal/45">
                        Imported · {row.importSource.sheet} row{" "}
                        {row.importSource.rowStart}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-3">{row.scheduleYear}</td>
                  <td className="px-2 py-3">{serviceTypeLabel(row.serviceType)}</td>
                  <td className="px-2 py-3">
                    <div>{formatDate(row.estimatedDate ?? row.bookDate)}</div>
                    <div className="text-[11px] text-nurture-charcoal/45">
                      booked {formatDate(row.bookDate)}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.assignmentRoles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-nurture-sage/10 px-2 py-0.5 text-[11px] font-medium text-nurture-sage-dark"
                        >
                          {ROLE_LABELS[role]}
                        </span>
                      ))}
                    </div>
                    {row.packageLabels.length > 0 ? (
                      <div className="mt-1 text-[11px] text-nurture-charcoal/45">
                        {row.packageLabels.join(", ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-3">
                    <div>{formatEngagementMoney(row.totalClientFeeCents)}</div>
                    <div className="text-[11px] text-nurture-charcoal/45">
                      doula {formatEngagementMoney(row.totalDoulaFeeCents)}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex min-w-[220px] flex-col gap-2">
                      <select
                        value={targetByEngagement[row.engagementId] ?? ""}
                        onChange={(event) =>
                          setTargetByEngagement((current) => ({
                            ...current,
                            [row.engagementId]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-nurture-sage/30 px-2 py-1.5 text-sm"
                      >
                        <option value="">Move to provider…</option>
                        {targetOptions.map((option) => (
                          <option key={option.providerId} value={option.providerId}>
                            {option.displayName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={movingEngagementId === row.engagementId}
                        onClick={() => void reallocate(row)}
                        className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark disabled:opacity-60"
                      >
                        {movingEngagementId === row.engagementId
                          ? "Moving…"
                          : "Reassign job"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ProviderEngagementsPanel;
