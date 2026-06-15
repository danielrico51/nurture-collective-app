"use client";

import AdminTabBar from "@/components/Admin/AdminTabBar";
import EventCalendarPanel from "@/components/Admin/EventCalendarPanel";
import EventClassSettingsPanel from "@/components/Admin/EventClassSettingsPanel";
import EventPaymentsPanel from "@/components/Admin/EventPaymentsPanel";
import EventRegistrationsPanel from "@/components/Admin/EventRegistrationsPanel";
import {
  createAdminEvent,
  deleteAdminEvent,
  fetchAdminEvents,
  updateAdminEvent,
} from "@/lib/api/eventsClient";
import {
  formatEventDate,
  kindLabel,
  LISTING_STATUS_LABELS,
  listingStatusBadgeClass,
  REGISTRATION_MODE_LABELS,
} from "@/lib/events/format";
import { slugifyTitle } from "@/lib/blog/slug";
import type {
  EventFormat,
  EventFaqItem,
  EventItem,
  EventKind,
  EventListingStatus,
  EventPublishStatus,
  EventRegistrationMode,
} from "@/types/event";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const emptyDraft = (): Partial<EventItem> => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  kind: "class",
  format: "In-person",
  location: "Northern New Jersey",
  eventDate: new Date().toISOString().slice(0, 10),
  listingStatus: "contact",
  status: "draft",
  registrationUrl: "",
  registrationMode: "online",
  capacity: undefined,
  waitlistEnabled: false,
  priceCents: undefined,
  startTime: "",
  durationMinutes: undefined,
  instructorName: "",
  instructorEmail: "",
  faq: [],
});

const dollarsFromCents = (priceCents?: number): string => {
  if (typeof priceCents !== "number" || priceCents <= 0) return "";
  return (priceCents / 100).toFixed(2).replace(/\.00$/, "");
};

const centsFromDollars = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
};

const buildEventPayload = (form: Partial<EventItem>, priceDollars: string) => ({
  title: form.title,
  excerpt: form.excerpt ?? "",
  body: form.body ?? "",
  kind: form.kind as EventKind,
  format: form.format as EventFormat,
  location: form.location,
  eventDate: form.eventDate,
  startTime: form.startTime?.trim() || undefined,
  durationMinutes: form.durationMinutes,
  listingStatus: form.listingStatus as EventListingStatus,
  status: form.status as EventPublishStatus,
  registrationUrl: form.registrationUrl || undefined,
  registrationMode: form.registrationMode as EventRegistrationMode,
  capacity: form.capacity,
  waitlistEnabled: form.waitlistEnabled,
  priceCents: centsFromDollars(priceDollars),
  instructorName: form.instructorName?.trim() || undefined,
  instructorEmail: form.instructorEmail?.trim() || undefined,
  faq: form.faq?.filter((entry) => entry.question.trim() && entry.answer.trim()),
});

type HubView = "listings" | "settings";
type ListingTab = "details" | "registrations" | "payments" | "calendar";

const EventsManager = () => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<EventItem>>(emptyDraft());
  const [priceDollars, setPriceDollars] = useState("");
  const [hubView, setHubView] = useState<HubView>("listings");
  const [listingTab, setListingTab] = useState<ListingTab>("details");

  const loadItems = useCallback(async (seed = false) => {
    setLoading(true);
    try {
      const { items: next } = await fetchAdminEvents(seed);
      setItems(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems(true);
  }, [loadItems]);

  const selectItem = (item: EventItem) => {
    setHubView("listings");
    setListingTab("details");
    setIsNew(false);
    setSelectedSlug(item.slug);
    setForm({ ...item, faq: item.faq ?? [] });
    setPriceDollars(dollarsFromCents(item.priceCents));
  };

  const startNew = () => {
    setHubView("listings");
    setListingTab("details");
    setIsNew(true);
    setSelectedSlug(null);
    setForm(emptyDraft());
    setPriceDollars("");
  };

  const updateField = <K extends keyof EventItem>(key: K, value: EventItem[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && isNew && !prev.slug?.trim()) {
        next.slug = slugifyTitle(String(value));
      }
      return next;
    });
  };

  const updateFaqItem = (
    index: number,
    key: keyof EventFaqItem,
    value: string
  ) => {
    setForm((prev) => {
      const faq = [...(prev.faq ?? [])];
      faq[index] = { ...faq[index], [key]: value };
      return { ...prev, faq };
    });
  };

  const addFaqItem = () => {
    setForm((prev) => ({
      ...prev,
      faq: [...(prev.faq ?? []), { question: "", answer: "" }],
    }));
  };

  const removeFaqItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      faq: (prev.faq ?? []).filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const title = form.title.trim();
      const payload = buildEventPayload({ ...form, title }, priceDollars);
      if (isNew) {
        const { item } = await createAdminEvent({
          ...payload,
          title,
          slug: form.slug?.trim() || undefined,
        });
        toast.success("Event created");
        await loadItems();
        selectItem(item);
      } else if (selectedSlug) {
        const { item } = await updateAdminEvent(selectedSlug, payload);
        toast.success("Event saved");
        await loadItems();
        selectItem(item);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlug || isNew) return;
    if (!window.confirm(`Delete "${form.title}"?`)) return;
    setSaving(true);
    try {
      await deleteAdminEvent(selectedSlug);
      toast.success("Deleted");
      startNew();
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const editing = isNew || Boolean(selectedSlug);
  const onlineRegistration = form.registrationMode === "online";
  const listingTabs: Array<{ id: ListingTab; label: string; disabled?: boolean }> =
    [
      { id: "details", label: "Details" },
      {
        id: "registrations",
        label: "Registrations",
        disabled: isNew || !onlineRegistration,
      },
      {
        id: "payments",
        label: "Payments",
        disabled: isNew || !onlineRegistration,
      },
      { id: "calendar", label: "Calendar", disabled: isNew },
    ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Events & classes
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Listings, registrations, payments, and class operations ({items.length}{" "}
            total).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadItems(true)}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Reload
          </button>
          {hubView === "listings" ? (
            <button
              type="button"
              onClick={startNew}
              className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
            >
              New listing
            </button>
          ) : null}
        </div>
      </div>

      <AdminTabBar
        tabs={[
          { id: "listings", label: "Listings" },
          { id: "settings", label: "Settings" },
        ]}
        active={hubView}
        onChange={setHubView}
      />

      {hubView === "settings" ? (
        <div className="rounded-2xl border border-nurture-sage/15 bg-white p-6">
          <EventClassSettingsPanel />
        </div>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-nurture-sage/15 bg-nurture-cream/30 p-4">
          {loading ? (
            <p className="text-sm text-nurture-charcoal/60">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-nurture-charcoal/60">No listings yet.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => selectItem(item)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selectedSlug === item.slug && !isNew
                        ? "bg-white shadow-sm ring-1 ring-nurture-sage/25"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <span className="flex flex-wrap gap-1">
                      <span className="rounded-full bg-nurture-cream px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {kindLabel(item.kind)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${listingStatusBadgeClass(item.listingStatus)}`}
                      >
                        {item.listingStatus}
                      </span>
                    </span>
                    <span className="mt-1 block font-medium text-nurture-charcoal">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-nurture-charcoal/50">
                      {formatEventDate(item.eventDate)}
                      {item.status === "draft" ? " · draft" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="rounded-2xl border border-nurture-sage/15 bg-white p-6">
          {!editing ? (
            <p className="text-sm text-nurture-charcoal/60">
              Select a listing or create a new one.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-nurture-charcoal">
                      {isNew ? "New listing" : form.title}
                    </h3>
                    {!isNew && selectedSlug ? (
                      <p className="mt-1 text-sm text-nurture-charcoal/60">
                        /events-and-classes/{selectedSlug}
                      </p>
                    ) : null}
                  </div>
                  {!isNew && selectedSlug && form.status === "published" ? (
                    <Link
                      href={`/events-and-classes/${selectedSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-sm font-semibold text-nurture-sage-dark hover:underline"
                    >
                      View live →
                    </Link>
                  ) : null}
                </div>
              </div>

              {!isNew ? (
                <AdminTabBar
                  tabs={listingTabs}
                  active={listingTab}
                  onChange={setListingTab}
                />
              ) : null}

              {listingTab === "details" || isNew ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Title
                  </span>
                  <input
                    type="text"
                    value={form.title ?? ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Slug
                  </span>
                  <input
                    type="text"
                    value={form.slug ?? ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    disabled={!isNew}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm disabled:bg-nurture-cream/50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Event date
                  </span>
                  <input
                    type="date"
                    value={form.eventDate ?? ""}
                    onChange={(e) => updateField("eventDate", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Type
                  </span>
                  <select
                    value={form.kind ?? "class"}
                    onChange={(e) => updateField("kind", e.target.value as EventKind)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  >
                    <option value="class">Class</option>
                    <option value="event">Event</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Format
                  </span>
                  <select
                    value={form.format ?? "In-person"}
                    onChange={(e) => updateField("format", e.target.value as EventFormat)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  >
                    <option value="In-person">In-person</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Listing status
                  </span>
                  <select
                    value={form.listingStatus ?? "contact"}
                    onChange={(e) =>
                      updateField("listingStatus", e.target.value as EventListingStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  >
                    {(Object.keys(LISTING_STATUS_LABELS) as EventListingStatus[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {LISTING_STATUS_LABELS[key]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Publish status
                  </span>
                  <select
                    value={form.status ?? "draft"}
                    onChange={(e) =>
                      updateField("status", e.target.value as EventPublishStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Location
                  </span>
                  <input
                    type="text"
                    value={form.location ?? ""}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Excerpt
                  </span>
                  <textarea
                    value={form.excerpt ?? ""}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Details (paragraphs separated by blank lines)
                  </span>
                  <textarea
                    value={form.body ?? ""}
                    onChange={(e) => updateField("body", e.target.value)}
                    rows={10}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 font-mono text-sm leading-relaxed"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Registration URL (optional, /contact or https://…)
                  </span>
                  <input
                    type="text"
                    value={form.registrationUrl ?? ""}
                    onChange={(e) => updateField("registrationUrl", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Registration mode
                  </span>
                  <select
                    value={form.registrationMode ?? "online"}
                    onChange={(e) =>
                      updateField(
                        "registrationMode",
                        e.target.value as EventRegistrationMode
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  >
                    {(
                      Object.keys(REGISTRATION_MODE_LABELS) as EventRegistrationMode[]
                    ).map((mode) => (
                      <option key={mode} value={mode}>
                        {REGISTRATION_MODE_LABELS[mode]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Capacity
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.capacity ?? ""}
                    onChange={(e) =>
                      updateField(
                        "capacity",
                        e.target.value === ""
                          ? undefined
                          : Number.parseInt(e.target.value, 10)
                      )
                    }
                    placeholder="Unlimited"
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Price (USD)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Start time
                  </span>
                  <input
                    type="time"
                    value={form.startTime ?? ""}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Duration (minutes)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.durationMinutes ?? ""}
                    onChange={(e) =>
                      updateField(
                        "durationMinutes",
                        e.target.value === ""
                          ? undefined
                          : Number.parseInt(e.target.value, 10)
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.waitlistEnabled)}
                    onChange={(e) => updateField("waitlistEnabled", e.target.checked)}
                    className="rounded border-nurture-sage/30"
                  />
                  <span className="text-sm text-nurture-charcoal/75">
                    Enable waitlist when full
                  </span>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Instructor name
                  </span>
                  <input
                    type="text"
                    value={form.instructorName ?? ""}
                    onChange={(e) => updateField("instructorName", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                    Instructor email
                  </span>
                  <input
                    type="email"
                    value={form.instructorEmail ?? ""}
                    onChange={(e) => updateField("instructorEmail", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                  />
                </label>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                      FAQ
                    </span>
                    <button
                      type="button"
                      onClick={addFaqItem}
                      className="text-xs font-semibold text-nurture-sage-dark hover:underline"
                    >
                      Add question
                    </button>
                  </div>
                  <div className="mt-2 space-y-3">
                    {(form.faq ?? []).map((entry, index) => (
                      <div
                        key={`faq-${index}`}
                        className="rounded-xl border border-nurture-sage/15 p-3"
                      >
                        <input
                          type="text"
                          value={entry.question}
                          onChange={(e) =>
                            updateFaqItem(index, "question", e.target.value)
                          }
                          placeholder="Question"
                          className="w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={entry.answer}
                          onChange={(e) =>
                            updateFaqItem(index, "answer", e.target.value)
                          }
                          rows={2}
                          placeholder="Answer"
                          className="mt-2 w-full rounded-lg border border-nurture-sage/25 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFaqItem(index)}
                          className="mt-2 text-xs font-medium text-red-700/80 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-nurture-sage/10 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : isNew ? "Create" : "Save"}
                </button>
                {!isNew && selectedSlug ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={saving}
                    className="text-sm font-medium text-red-700/80 hover:text-red-800"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </form>
              ) : null}

              {!isNew && selectedSlug && listingTab === "registrations" ? (
                <EventRegistrationsPanel
                  eventSlug={selectedSlug}
                  instructorEmail={form.instructorEmail}
                />
              ) : null}

              {!isNew && selectedSlug && listingTab === "payments" ? (
                <EventPaymentsPanel
                  eventSlug={selectedSlug}
                  priceCents={form.priceCents}
                />
              ) : null}

              {!isNew && selectedSlug && listingTab === "calendar" ? (
                <EventCalendarPanel
                  event={form}
                  eventSlug={selectedSlug}
                  onSynced={(item) => selectItem(item)}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default EventsManager;
