"use client";

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
} from "@/lib/events/format";
import { slugifyTitle } from "@/lib/blog/slug";
import type {
  EventFormat,
  EventItem,
  EventKind,
  EventListingStatus,
  EventPublishStatus,
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
});

const EventsManager = () => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<EventItem>>(emptyDraft());

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
    setIsNew(false);
    setSelectedSlug(item.slug);
    setForm({ ...item });
  };

  const startNew = () => {
    setIsNew(true);
    setSelectedSlug(null);
    setForm(emptyDraft());
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

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const { item } = await createAdminEvent({
          title: form.title,
          excerpt: form.excerpt ?? "",
          body: form.body ?? "",
          kind: form.kind as EventKind,
          format: form.format as EventFormat,
          location: form.location,
          eventDate: form.eventDate,
          listingStatus: form.listingStatus as EventListingStatus,
          status: form.status as EventPublishStatus,
          registrationUrl: form.registrationUrl || undefined,
          slug: form.slug?.trim() || undefined,
        });
        toast.success("Event created");
        await loadItems();
        selectItem(item);
      } else if (selectedSlug) {
        const { item } = await updateAdminEvent(selectedSlug, {
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          kind: form.kind as EventKind,
          format: form.format as EventFormat,
          location: form.location,
          eventDate: form.eventDate,
          listingStatus: form.listingStatus as EventListingStatus,
          status: form.status as EventPublishStatus,
          registrationUrl: form.registrationUrl || undefined,
        });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Events & classes
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Manage listings stored in S3 ({items.length} total).
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
          <button
            type="button"
            onClick={startNew}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            New listing
          </button>
        </div>
      </div>

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
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-nurture-sage/10 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : isNew ? "Create" : "Save"}
                </button>
                {!isNew && selectedSlug && form.status === "published" ? (
                  <Link
                    href={`/events-and-classes/${selectedSlug}`}
                    target="_blank"
                    className="text-sm font-semibold text-nurture-sage-dark hover:underline"
                  >
                    View live →
                  </Link>
                ) : null}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsManager;
