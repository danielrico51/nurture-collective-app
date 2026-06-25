"use client";

import ClientsCrmStorageNote from "@/components/Admin/ClientsCrmStorageNote";
import ProviderDetailPanel from "@/components/Admin/ProviderDetailPanel";
import ProviderManualForm from "@/components/Admin/ProviderManualForm";
import ProviderPayoutReport from "@/components/Admin/ProviderPayoutReport";
import { PROVIDERS_TOUR } from "@/tour/providersTourSteps";
import { type ProviderTourFormDraft } from "@/tour/providersTourDemo";
import TourHelpButton from "@/tour/TourHelpButton";
import { useProvidersTourActions } from "@/tour/useProvidersTourActions";
import {
  fetchAdminProviders,
  fetchProviderStats,
  PROVIDER_ROLE_LABELS,
  PROVIDER_STATUS_LABELS,
} from "@/lib/api/providersClient";
import ProviderStatsSummary from "@/components/Admin/ProviderStatsSummary";
import type {
  AdminProvidersResponse,
  ProviderRecord,
  ProviderRole,
  ProviderStats,
  ProviderStatus,
} from "@/types/provider";
import { PROVIDER_ROLES, PROVIDER_STATUSES } from "@/types/provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type QueueFilter = "active" | "archived" | "all";
type RoleFilter = "all" | ProviderRole;
type StatusFilter = "all" | ProviderStatus;

const STATUS_BADGE: Record<ProviderStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-nurture-cream text-nurture-charcoal/70",
  archived: "bg-nurture-charcoal/10 text-nurture-charcoal/60",
};

const ProviderQueue = () => {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("active");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [tourFormDraft, setTourFormDraft] = useState<ProviderTourFormDraft | null>(
    null
  );
  const [storageScope, setStorageScope] = useState<
    AdminProvidersResponse["storage"] | null
  >(null);
  const [providerStats, setProviderStats] = useState<
    Record<string, ProviderStats>
  >({});
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadProviderStats = useCallback(async () => {
    setStatsError(null);
    setStatsLoading(true);
    try {
      const statsData = await fetchProviderStats();
      setProviderStats(statsData.stats);
      setStatsYear(statsData.year);
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : "Could not load provider stats"
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProviders = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    setError(null);
    if (!background) setLoading(true);
    try {
      const data = await fetchAdminProviders(true);
      setProviders(data.providers);
      setStorageScope(data.storage ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load providers");
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders();
    void loadProviderStats();
  }, [loadProviders, loadProviderStats]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return providers.filter((provider) => {
      if (queueFilter === "active" && provider.archivedAt) return false;
      if (queueFilter === "archived" && !provider.archivedAt) return false;
      if (statusFilter !== "all" && provider.status !== statusFilter) return false;
      if (roleFilter !== "all" && !provider.roles.includes(roleFilter)) return false;
      if (query) {
        const haystack = [
          provider.displayName,
          ...provider.aliases,
          provider.email,
          provider.phone,
          provider.notes,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [providers, queueFilter, roleFilter, statusFilter, search]);

  useProvidersTourActions({
    filtered,
    setShowManualForm,
    setExpandedId,
    setTourFormDraft,
  });

  return (
    <div className="space-y-6">
      <div
        id="tour-providers-header"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Providers
          </h1>
          <p className="mt-1 max-w-xl text-sm text-nurture-charcoal/65">
            Registry of postpartum and birth doulas, backup coverage, and educators.
            Used by the service schedule and linked to client engagements.
            <ClientsCrmStorageNote
              storage={storageScope}
              prodLabel="Production provider data"
            />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TourHelpButton tour={PROVIDERS_TOUR} disabled={loading} />
          <button
            id="tour-providers-add"
            type="button"
            onClick={() => setShowManualForm((current) => !current)}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark"
          >
            {showManualForm ? "Close" : "Add provider"}
          </button>
          <button
            type="button"
            onClick={() => {
              void loadProviders({ background: true });
              void loadProviderStats();
            }}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {statsError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Job stats could not be loaded: {statsError}
          <button
            type="button"
            onClick={() => void loadProviderStats()}
            className="ml-2 underline hover:no-underline"
          >
            Retry stats
          </button>
        </div>
      ) : statsLoading && providers.length > 0 ? (
        <p className="text-xs text-nurture-charcoal/50">Refreshing job stats…</p>
      ) : null}

      {showManualForm ? (
        <ProviderManualForm
          initialDraft={tourFormDraft ?? undefined}
          tourDemo={Boolean(tourFormDraft)}
          onCreated={() => {
            setShowManualForm(false);
            setTourFormDraft(null);
            void loadProviders();
            toast.success("Provider list refreshed");
          }}
          onCancel={() => {
            setShowManualForm(false);
            setTourFormDraft(null);
          }}
        />
      ) : null}

      <div id="tour-providers-payout">
        {!loading && !error ? (
          <ProviderPayoutReport providers={providers.filter((p) => !p.archivedAt)} />
        ) : (
          <section className="space-y-2 rounded-2xl border border-nurture-sage/20 bg-white/70 p-5">
            <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
              Payout report
            </h2>
            <p className="text-sm text-nurture-charcoal/60">
              {loading ? "Loading payout data…" : "Load providers to view payouts."}
            </p>
          </section>
        )}
      </div>

      <div id="tour-providers-filters" className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, alias, email…"
          className="min-w-[220px] flex-1 rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
        />
        <select
          value={queueFilter}
          onChange={(event) => setQueueFilter(event.target.value as QueueFilter)}
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          {PROVIDER_ROLES.map((role) => (
            <option key={role} value={role}>
              {PROVIDER_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {PROVIDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PROVIDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <span className="text-xs text-nurture-charcoal/50">
          {filtered.length} of {providers.length}
        </span>
      </div>

      <div id="tour-providers-list">
        {loading ? (
          <p className="text-sm text-nurture-charcoal/60">Loading providers…</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-nurture-charcoal/60">
            No providers match these filters.
          </p>
        ) : (
          <ul className="space-y-3">
          {filtered.map((provider, index) => {
            const expanded = expandedId === provider.providerId;
            const stats =
              providerStats[provider.providerId] ?? {
                providerId: provider.providerId,
                engagementCount: 0,
                primaryEngagementCount: 0,
                lifetimeClientFeeCents: 0,
                lifetimeDoulaPayoutCents: 0,
                ytdEngagementCount: 0,
                ytdClientFeeCents: 0,
                ytdDoulaPayoutCents: 0,
              };
            return (
              <li
                key={provider.providerId}
                id={index === 0 ? "tour-providers-first-row" : undefined}
                className="overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : provider.providerId)
                  }
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-nurture-charcoal">
                        {provider.displayName}
                      </span>
                      {provider.aliases.length > 1 ? (
                        <span className="rounded-full bg-nurture-sage/10 px-2 py-0.5 text-[11px] font-medium text-nurture-sage-dark">
                          {provider.aliases.length - 1} alias
                          {provider.aliases.length - 1 === 1 ? "" : "es"}
                        </span>
                      ) : null}
                      {provider.archivedAt ? (
                        <span className="rounded-full bg-nurture-charcoal/10 px-2 py-0.5 text-[11px] font-medium text-nurture-charcoal/60">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-nurture-charcoal/60">
                      {provider.roles.map((role) => PROVIDER_ROLE_LABELS[role]).join(" · ") ||
                        "No roles"}
                      {provider.email ? ` · ${provider.email}` : ""}
                    </p>
                    <ProviderStatsSummary stats={stats} year={statsYear} compact />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[provider.status]}`}
                  >
                    {PROVIDER_STATUS_LABELS[provider.status]}
                  </span>
                </button>
                {expanded ? (
                  <div className="border-t border-nurture-sage/15 bg-nurture-cream/30 px-5 py-5">
                    <ProviderDetailPanel
                      provider={provider}
                      providers={providers}
                      stats={stats}
                      statsYear={statsYear}
                      onChanged={() => {
                        void loadProviders({ background: true });
                        void loadProviderStats();
                      }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProviderQueue;
