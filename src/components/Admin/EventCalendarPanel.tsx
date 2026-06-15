"use client";

import { DEFAULT_CLASS_EVENTS_CALENDAR_EMBED_URL } from "@/config/classCalendarConstants";
import { syncAdminEventCalendar } from "@/lib/api/eventsClient";
import type { EventItem } from "@/types/event";
import { useState } from "react";
import toast from "react-hot-toast";

interface EventCalendarPanelProps {
  event: Partial<EventItem>;
  eventSlug: string | null;
  onSynced?: (item: EventItem) => void;
}

const EventCalendarPanel = ({
  event,
  eventSlug,
  onSynced,
}: EventCalendarPanelProps) => {
  const [syncing, setSyncing] = useState(false);

  if (!eventSlug) return null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { item } = await syncAdminEventCalendar(eventSlug);
      onSynced?.(item);
      if (item.googleCalendarSyncError?.trim()) {
        toast.error(item.googleCalendarSyncError);
        return;
      }
      if (item.googleCalendarEventId) {
        toast.success("Google Calendar updated");
        return;
      }
      toast.error(
        "Calendar sync finished without creating an event. Check Settings and the error below."
      );
    } catch (error) {
      const syncError = error as Error & { item?: EventItem };
      if (syncError.item) onSynced?.(syncError.item);
      toast.error(
        syncError instanceof Error ? syncError.message : "Calendar sync failed"
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-nurture-sage/10 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Google Calendar
          </h3>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            {event.status === "published"
              ? "Published listings sync as a single session event. Confirmed registrations are added as attendees."
              : "Publish this listing to create a calendar session."}
          </p>
          <p className="mt-2 text-xs text-nurture-charcoal/55">
            The classes calendar must be shared with{" "}
            <strong>admin@nesting-place.com</strong> (Make changes to events).
            Saving as <strong>Draft</strong> does not remove a synced event; only{" "}
            <strong>Completed</strong> or deleting the listing removes it from Google
            Calendar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing || event.status !== "published"}
          className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync calendar"}
        </button>
      </div>

      <dl className="grid gap-2 text-sm text-nurture-charcoal/75 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
            Sync status
          </dt>
          <dd className="mt-1">
            {event.googleCalendarSyncError
              ? "Error"
              : event.googleCalendarEventId
                ? "Synced"
                : "Not synced"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
            Last synced
          </dt>
          <dd className="mt-1">
            {event.googleCalendarSyncedAt
              ? new Date(event.googleCalendarSyncedAt).toLocaleString()
              : "—"}
          </dd>
        </div>
      </dl>

      {event.googleCalendarSyncError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {event.googleCalendarSyncError}
        </p>
      ) : null}

      {event.googleCalendarHtmlLink ? (
        <a
          href={event.googleCalendarHtmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-semibold text-nurture-sage-dark hover:underline"
        >
          Open session in Google Calendar →
        </a>
      ) : null}

      <a
        href={DEFAULT_CLASS_EVENTS_CALENDAR_EMBED_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm font-semibold text-nurture-sage-dark hover:underline"
      >
        View classes calendar →
      </a>
    </div>
  );
};

export default EventCalendarPanel;
