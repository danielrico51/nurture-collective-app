"use client";

import ClientsCrmStorageNote from "@/components/Admin/ClientsCrmStorageNote";
import ClientDetailPanel from "@/components/Admin/ClientDetailPanel";
import ClientManualForm from "@/components/Admin/ClientManualForm";
import { fetchAdminClients } from "@/lib/api/clientsClient";
import { fetchTeamMembers } from "@/lib/api/tasksClient";
import { CLIENTS_TOUR } from "@/tour/clientsTourSteps";
import {
  type ClientTourDetailTab,
  type ClientTourFormDraft,
} from "@/tour/clientsTourDemo";
import TourHelpButton from "@/tour/TourHelpButton";
import { useClientsTourActions } from "@/tour/useClientsTourActions";
import type { ClientRecord, ClientStatus, AdminClientsResponse } from "@/types/client";
import { CLIENT_STATUSES } from "@/types/client";
import type { TeamMember } from "@/types/teamMember";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ClientQueueProps {
  coordinatorId: string;
  coordinatorEmail: string;
}

type QueueFilter = "active" | "archived" | "all";
type StatusFilter = "all" | ClientStatus;

const statusLabel = (status: ClientStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const STATUS_BADGE: Record<ClientStatus, string> = {
  prospect: "bg-amber-100 text-amber-800",
  onboarding: "bg-sky-100 text-sky-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-nurture-cream text-nurture-charcoal/70",
  archived: "bg-nurture-charcoal/10 text-nurture-charcoal/60",
};

const ClientQueue = ({ coordinatorId, coordinatorEmail }: ClientQueueProps) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [tourFormDraft, setTourFormDraft] = useState<ClientTourFormDraft | null>(
    null
  );
  const [tourDetailTab, setTourDetailTab] = useState<ClientTourDetailTab | null>(
    null
  );
  const [storageScope, setStorageScope] = useState<
    AdminClientsResponse["storage"] | null
  >(null);

  const loadClients = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    setError(null);
    if (!background) {
      setLoading(true);
    }
    try {
      const data = await fetchAdminClients(true);
      setClients(data.clients);
      setStorageScope(data.storage ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load clients");
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const data = await fetchTeamMembers();
      setMembers(data.members);
    } catch {
      // Non-fatal: coordinator assignment just shows unassigned.
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
    void loadMembers();
  }, [loadClients, loadMembers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (queueFilter === "active" && client.archivedAt) return false;
      if (queueFilter === "archived" && !client.archivedAt) return false;
      if (statusFilter !== "all" && client.status !== statusFilter) return false;
      if (query) {
        const haystack = [
          client.name,
          client.email,
          client.phone,
          client.clientId,
          client.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [clients, queueFilter, statusFilter, search]);

  useClientsTourActions({
    filtered,
    setShowManualForm,
    setExpandedId,
    setTourFormDraft,
    setTourDetailTab,
  });

  const handleCreated = () => {
    setShowManualForm(false);
    setTourFormDraft(null);
    void loadClients();
    toast.success("Client list refreshed");
  };

  return (
    <div className="space-y-6">
      <div
        id="tour-clients-header"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Client CRM
          </h1>
          <p className="mt-1 max-w-xl text-sm text-nurture-charcoal/65">
            Manage active clients, link leads and app users, and track
            proposals, billing, and communications in one place.
            <ClientsCrmStorageNote
              storage={storageScope}
              prodLabel="Production client data"
            />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TourHelpButton tour={CLIENTS_TOUR} disabled={loading} />
          <button
            id="tour-clients-add"
            type="button"
            onClick={() => setShowManualForm((current) => !current)}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark"
          >
            {showManualForm ? "Close" : "Add client"}
          </button>
          <button
            type="button"
            onClick={() => void loadClients({ background: true })}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {showManualForm ? (
        <ClientManualForm
          members={members}
          membersLoading={membersLoading}
          defaultCoordinatorId={coordinatorId}
          initialDraft={tourFormDraft ?? undefined}
          tourDemo={Boolean(tourFormDraft)}
          onCreated={handleCreated}
          onCancel={() => {
            setShowManualForm(false);
            setTourFormDraft(null);
          }}
        />
      ) : null}

      <div
        id="tour-clients-filters"
        className="flex flex-wrap items-center gap-3"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, phone, tag…"
          className="min-w-[220px] flex-1 rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
        />
        <select
          value={queueFilter}
          onChange={(event) => setQueueFilter(event.target.value as QueueFilter)}
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
        >
          <option value="all">All statuses</option>
          {CLIENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <span className="text-xs text-nurture-charcoal/50">
          {filtered.length} of {clients.length}
        </span>
      </div>

      <div id="tour-clients-list">
        {loading ? (
          <p className="text-sm text-nurture-charcoal/60">Loading clients…</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-nurture-charcoal/60">
            No clients match these filters.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((client, index) => {
              const expanded = expandedId === client.clientId;
              return (
                <li
                  key={client.clientId}
                  id={index === 0 ? "tour-clients-first-row" : undefined}
                  className="overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : client.clientId)
                    }
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-nurture-charcoal">
                          {client.name || "Unnamed client"}
                        </span>
                        {client.leadId ? (
                          <span className="rounded-full bg-nurture-sage/10 px-2 py-0.5 text-[11px] font-medium text-nurture-sage-dark">
                            Lead linked
                          </span>
                        ) : null}
                        {client.cognitoSub ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                            App user
                          </span>
                        ) : null}
                        {client.archivedAt ? (
                          <span className="rounded-full bg-nurture-charcoal/10 px-2 py-0.5 text-[11px] font-medium text-nurture-charcoal/60">
                            Archived
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-nurture-charcoal/60">
                        {client.email || client.phone || "No contact info"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[client.status]}`}
                    >
                      {statusLabel(client.status)}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="border-t border-nurture-sage/15 bg-nurture-cream/30 px-5 py-5">
                      <ClientDetailPanel
                        clientId={client.clientId}
                        members={members}
                        membersLoading={membersLoading}
                        tourRequestedTab={
                          expandedId === client.clientId ? tourDetailTab : null
                        }
                        onChanged={() => void loadClients({ background: true })}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-nurture-charcoal/40">
        Signed in as {coordinatorEmail || coordinatorId}
      </p>
    </div>
  );
};

export default ClientQueue;
