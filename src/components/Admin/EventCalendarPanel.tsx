"use client";

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
      toast.success(
        item.googleCalendarEventId
          ? "Google Calendar updated"
          : "Calendar sync completed"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Calendar sync failed"
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
          Open in Google Calendar →
        </a>
      ) : null}
    </div>
  );
};

export default EventCalendarPanel;
