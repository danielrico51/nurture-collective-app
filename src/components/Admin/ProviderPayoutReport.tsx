"use client";

import ClientsCrmStorageNote from "@/components/Admin/ClientsCrmStorageNote";
import {
  fetchProviderPayoutReport,
  formatEngagementMoney,
} from "@/lib/api/scheduleClient";
import type { ProviderRecord } from "@/types/provider";
import type { ClientsCrmStorageScope } from "@/types/client";
import type { ProviderPayoutReportRow } from "@/types/serviceEngagement";
import { useCallback, useEffect, useState } from "react";

interface ProviderPayoutReportProps {
  providers: ProviderRecord[];
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const ProviderPayoutReport = ({ providers }: ProviderPayoutReportProps) => {
  const [rows, setRows] = useState<ProviderPayoutReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "paid">("pending");
  const [storageScope, setStorageScope] = useState<ClientsCrmStorageScope | null>(
    null
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchProviderPayoutReport({
        providerId: providerId || undefined,
        status: status === "all" ? undefined : status,
      });
      setRows(data.payouts);
      setStorageScope(data.storage ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payouts");
    } finally {
      setLoading(false);
    }
  }, [providerId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingTotal = rows
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + row.amountCents, 0);

  return (
    <section className="space-y-4 rounded-2xl border border-nurture-sage/20 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Payout report
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/60">
            Pending provider payouts across all client engagements in this CRM scope.
            <ClientsCrmStorageNote
              storage={storageScope}
              prodLabel="Production payout data"
            />
            {status !== "paid" && rows.length > 0 ? (
              <span className="ml-1 font-medium text-nurture-charcoal">
                Pending total: {formatEngagementMoney(pendingTotal)}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
        >
          <option value="">All providers</option>
          {providers.map((provider) => (
            <option key={provider.providerId} value={provider.providerId}>
              {provider.displayName}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "all" | "pending" | "paid")
          }
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-nurture-charcoal/60">Loading payouts…</p>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">No payouts match these filters.</p>
      ) : (
        <ul className="divide-y divide-nurture-sage/10 rounded-xl border border-nurture-sage/15">
          {rows.map((row) => (
            <li
              key={row.payoutBatchId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{row.providerName || "Unknown"}</span>
                <span className="ml-2 text-nurture-charcoal/60">{row.clientName}</span>
                <span className="ml-2 text-nurture-charcoal/50">
                  {row.scheduleYear} · booked {formatDate(row.bookDate)}
                </span>
                {row.visitDatesLabel ? (
                  <span className="ml-2 text-nurture-charcoal/45">
                    {row.visitDatesLabel}
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <span className="font-medium">
                  {formatEngagementMoney(row.amountCents)}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    row.status === "paid" ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {row.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ProviderPayoutReport;
