"use client";

import ClientCommunicationsTab from "@/components/Admin/ClientCommunicationsTab";
import ClientScheduleTab from "@/components/Admin/ClientScheduleTab";
import ClientServicesTab from "@/components/Admin/ClientServicesTab";
import LeadCoordinatorSelect from "@/components/Admin/LeadCoordinatorSelect";
import ProposalPanel from "@/components/Admin/ProposalPanel";
import {
  addAdminClientNote,
  fetchAdminClientDetail,
  linkAdminClient,
  updateAdminClient,
} from "@/lib/api/clientsClient";
import type {
  ClientDetailResponse,
  ClientNoteType,
  ClientStatus,
} from "@/types/client";
import { CLIENT_STATUSES } from "@/types/client";
import type { TeamMember } from "@/types/teamMember";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ClientDetailPanelProps {
  clientId: string;
  members: TeamMember[];
  membersLoading?: boolean;
  onChanged: () => void;
}

type DetailTab =
  | "overview"
  | "proposals"
  | "schedule"
  | "services"
  | "communications"
  | "notes";

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const statusLabel = (status: ClientStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
      {label}
    </p>
    <p className="mt-0.5 text-sm text-nurture-charcoal break-words">{value}</p>
  </div>
);

const ClientDetailPanel = ({
  clientId,
  members,
  membersLoading = false,
  onChanged,
}: ClientDetailPanelProps) => {
  const [detail, setDetail] = useState<ClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteType, setNoteType] = useState<ClientNoteType>("general");
  const [leadIdInput, setLeadIdInput] = useState("");
  const [cognitoInput, setCognitoInput] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileZip, setProfileZip] = useState("");
  const [profileTags, setProfileTags] = useState("");
  const [profileNotesSummary, setProfileNotesSummary] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [scheduleCount, setScheduleCount] = useState(0);

  const syncProfileFromClient = useCallback((client: ClientDetailResponse["client"]) => {
    setProfileName(client.name);
    setProfileEmail(client.email);
    setProfilePhone(client.phone);
    setProfileZip(client.locationZip ?? "");
    setProfileTags(client.tags.join(", "));
    setProfileNotesSummary(client.notesSummary);
  }, []);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchAdminClientDetail(clientId);
      setDetail(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load client";
      if (silent) {
        toast.error(message);
      } else {
        setError(message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [clientId]);

  useEffect(() => {
    setEditingProfile(false);
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detail?.client || editingProfile) return;
    syncProfileFromClient(detail.client);
  }, [detail?.client, editingProfile, syncProfileFromClient]);

  const handleStatusChange = async (status: ClientStatus) => {
    setSaving(true);
    try {
      await updateAdminClient(clientId, { status });
      toast.success("Status updated");
      await load({ silent: true });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCoordinatorChange = async (coordinatorId: string) => {
    setSaving(true);
    try {
      await updateAdminClient(clientId, { coordinatorId });
      toast.success("Coordinator updated");
      await load({ silent: true });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const tags = profileTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      await updateAdminClient(clientId, {
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        locationZip: profileZip.trim() || null,
        tags,
        notesSummary: profileNotesSummary.trim(),
      });
      toast.success("Profile updated");
      setEditingProfile(false);
      await load({ silent: true });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateAdminClient(
        clientId,
        detail.client.archivedAt ? { restore: true } : { archive: true }
      );
      toast.success(detail.client.archivedAt ? "Client restored" : "Client archived");
      await load({ silent: true });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLink = async (
    payload: { leadId?: string | null; cognitoSub?: string | null },
    successMessage: string
  ) => {
    setSaving(true);
    try {
      await linkAdminClient(clientId, payload);
      toast.success(successMessage);
      setLeadIdInput("");
      setCognitoInput("");
      await load({ silent: true });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Link failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    const text = noteDraft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await addAdminClientNote(clientId, text, noteType);
      setNoteDraft("");
      setNoteType("general");
      toast.success("Note added");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="px-1 py-4 text-sm text-nurture-charcoal/60">
        Loading client…
      </p>
    );
  }

  if (error || !detail) {
    return (
      <div className="px-1 py-4 text-sm text-red-600">
        {error ?? "Client not found"}
      </div>
    );
  }

  const { client, notes, lead, proposals, services, communications } = detail;

  const tabLabel = (item: DetailTab): string => {
    if (item === "overview") return "Overview";
    if (item === "proposals") return `Proposals (${proposals.length})`;
    if (item === "schedule") return `Schedule (${scheduleCount})`;
    if (item === "services") return `Services (${services.length})`;
    if (item === "communications")
      return `Communications (${communications.length})`;
    return `Notes (${notes.length})`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 border-b border-nurture-sage/15 pb-2">
        {(
          [
            "overview",
            "proposals",
            "schedule",
            "services",
            "communications",
            "notes",
          ] as DetailTab[]
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === item
                ? "bg-nurture-sage text-white"
                : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {tabLabel(item)}
              {item === "proposals" ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    tab === item
                      ? "bg-white/25 text-white"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Experimental
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                Status
              </span>
              <select
                value={client.status}
                disabled={saving}
                onChange={(event) =>
                  handleStatusChange(event.target.value as ClientStatus)
                }
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <LeadCoordinatorSelect
              value={client.coordinatorId}
              members={members}
              membersLoading={membersLoading}
              disabled={saving}
              onChange={handleCoordinatorChange}
            />
          </div>

          {editingProfile ? (
          <form
            onSubmit={handleProfileSave}
            className="grid gap-4 rounded-2xl border border-nurture-sage/15 bg-white p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-nurture-charcoal">
                Edit contact information
              </h4>
            </div>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                Name
              </span>
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                Email
              </span>
              <input
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                Phone
              </span>
              <input
                value={profilePhone}
                onChange={(event) => setProfilePhone(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                ZIP
              </span>
              <input
                value={profileZip}
                onChange={(event) => setProfileZip(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                Tags (comma-separated)
              </span>
              <input
                value={profileTags}
                onChange={(event) => setProfileTags(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
                Summary notes
              </span>
              <textarea
                rows={2}
                value={profileNotesSummary}
                onChange={(event) => setProfileNotesSummary(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage disabled:opacity-60"
              />
            </label>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
              >
                Save profile
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (detail?.client) syncProfileFromClient(detail.client);
                  setEditingProfile(false);
                }}
                className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-60"
              >
                Cancel
              </button>
              {(client.leadId || client.cognitoSub) ? (
                <p className="text-xs text-nurture-charcoal/50">
                  Updates sync to linked lead and app user when present.
                </p>
              ) : null}
            </div>
          </form>
          ) : (
          <div className="rounded-2xl border border-nurture-sage/15 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h4 className="text-sm font-semibold text-nurture-charcoal">
                Contact information
              </h4>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  syncProfileFromClient(client);
                  setEditingProfile(true);
                }}
                className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-60"
              >
                Edit
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Name" value={client.name || "—"} />
              <DetailItem label="Email" value={client.email || "—"} />
              <DetailItem label="Phone" value={client.phone || "—"} />
              <DetailItem label="ZIP" value={client.locationZip || "—"} />
              <DetailItem
                label="Tags"
                value={client.tags.length ? client.tags.join(", ") : "—"}
              />
              <DetailItem
                label="Summary notes"
                value={client.notesSummary || "—"}
              />
            </div>
          </div>
          )}

          <div className="grid gap-4 rounded-2xl border border-nurture-sage/15 bg-white p-4 sm:grid-cols-2">
            <DetailItem label="Client ID" value={client.clientId} />
            <DetailItem label="Source" value={client.source} />
            <DetailItem label="Created" value={formatDate(client.createdAt)} />
            <DetailItem label="Updated" value={formatDate(client.updatedAt)} />
          </div>

          <div className="rounded-2xl border border-nurture-sage/15 bg-white p-4">
            <h4 className="text-sm font-semibold text-nurture-charcoal">
              Linked lead
            </h4>
            {client.leadId ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-nurture-charcoal/80">
                  {lead
                    ? `${lead.name} · ${lead.status}`
                    : `Lead ${client.leadId}`}
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleLink({ leadId: null }, "Lead unlinked")
                  }
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={leadIdInput}
                  onChange={(event) => setLeadIdInput(event.target.value)}
                  placeholder="Lead ID"
                  className="flex-1 rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                />
                <button
                  type="button"
                  disabled={saving || !leadIdInput.trim()}
                  onClick={() =>
                    handleLink(
                      { leadId: leadIdInput.trim() },
                      "Lead linked"
                    )
                  }
                  className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
                >
                  Link lead
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-nurture-sage/15 bg-white p-4">
            <h4 className="text-sm font-semibold text-nurture-charcoal">
              Linked app user
            </h4>
            {client.cognitoSub ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-nurture-charcoal/80 break-all">
                  {client.cognitoSub}
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    handleLink({ cognitoSub: null }, "App user unlinked")
                  }
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={cognitoInput}
                  onChange={(event) => setCognitoInput(event.target.value)}
                  placeholder="Cognito user sub"
                  className="flex-1 rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                />
                <button
                  type="button"
                  disabled={saving || !cognitoInput.trim()}
                  onClick={() =>
                    handleLink(
                      { cognitoSub: cognitoInput.trim() },
                      "App user linked"
                    )
                  }
                  className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
                >
                  Link user
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={saving}
              onClick={handleArchiveToggle}
              className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-60"
            >
              {client.archivedAt ? "Restore client" : "Archive client"}
            </button>
          </div>
        </div>
      ) : tab === "proposals" ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            <span className="font-semibold">Experimental</span> — proposals are
            preview-only and not ready for client-facing use yet.
          </p>
          <ProposalPanel clientId={client.clientId} signerEmail={client.email} />
        </div>
      ) : tab === "schedule" ? (
        <ClientScheduleTab
          clientId={client.clientId}
          onCountChange={setScheduleCount}
          onChanged={() => {
            void load({ silent: true });
            onChanged();
          }}
        />
      ) : tab === "services" ? (
        <ClientServicesTab
          clientId={client.clientId}
          onChanged={() => {
            void load({ silent: true });
            onChanged();
          }}
        />
      ) : tab === "communications" ? (
        <ClientCommunicationsTab
          clientId={client.clientId}
          defaultEmail={client.email}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-nurture-sage/15 bg-white p-4">
            <textarea
              rows={3}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Add a note…"
              className="w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select
                value={noteType}
                onChange={(event) =>
                  setNoteType(event.target.value as ClientNoteType)
                }
                className="rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
              >
                <option value="general">General</option>
                <option value="call_log">Call log</option>
                <option value="billing">Billing</option>
                <option value="communication">Communication</option>
                <option value="follow_up">Follow up</option>
              </select>
              <button
                type="button"
                disabled={saving || !noteDraft.trim()}
                onClick={handleAddNote}
                className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
              >
                Add note
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="text-sm text-nurture-charcoal/60">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-2xl border border-nurture-sage/15 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-nurture-charcoal/50">
                    <span className="font-semibold uppercase tracking-wide">
                      {note.type.replace(/_/g, " ")}
                    </span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-nurture-charcoal">
                    {note.body}
                  </p>
                  {note.authorEmail ? (
                    <p className="mt-2 text-xs text-nurture-charcoal/50">
                      {note.authorEmail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDetailPanel;
