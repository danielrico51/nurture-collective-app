"use client";

import { JournalEntryEditor } from "@/components/Journal/JournalEntryEditor";
import { JournalProfilePanel } from "@/components/Journal/JournalProfilePanel";
import { JournalTimeline } from "@/components/Journal/JournalTimeline";
import { JournalTimelineComposer } from "@/components/Journal/JournalTimelineComposer";
import { MemberAppIcon } from "@/components/Member/MemberAppIcon";
import { getMemberAppById } from "@/config/memberApps";
import {
  deleteJournalEntry,
  fetchJournalEntries,
  fetchJournalEntry,
  fetchJournalProfile,
  fetchJournalTimeline,
  fetchJournalToday,
} from "@/lib/api/journalClient";
import { formatStageLabel } from "@/lib/journal/timeline";
import { useRequireMember } from "@/hooks/useRequireMember";
import type { JournalEntry, JournalEntryIndexItem, JournalProfile } from "@/types/journal";
import type { JourneyTimelineEvent } from "@/types/journal";
import { useCallback, useEffect, useState } from "react";

type SidePanel = "none" | "add" | "checkin" | "write" | "journey" | "entry";

export function JournalView() {
  const { ready, loading: authLoading } = useRequireMember();
  const app = getMemberAppById("journal");

  const [profile, setProfile] = useState<JournalProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntryIndexItem[]>([]);
  const [timeline, setTimeline] = useState<JourneyTimelineEvent[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<JournalEntry | null>(null);
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [panel, setPanel] = useState<SidePanel>("none");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, list, events, today] = await Promise.all([
        fetchJournalProfile(),
        fetchJournalEntries(),
        fetchJournalTimeline(),
        fetchJournalToday(),
      ]);
      setProfile(p);
      setEntries(list);
      setTimeline(events);
      setTodayCheckIn(today.checkIn);
      setPromptText(today.prompt.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load journal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const openEntry = async (id: string) => {
    try {
      const entry = await fetchJournalEntry(id);
      setEditingEntry(entry);
      setPanel("entry");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    try {
      await deleteJournalEntry(id);
      setEditingEntry(null);
      setPanel("none");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading your journal…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <header className="rounded-2xl border border-nurture-sage/15 bg-gradient-to-br from-nurture-cream/90 via-white to-nurture-sage/5 px-5 py-6 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nurture-sage/15 text-nurture-sage-dark">
            <MemberAppIcon icon="journal" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-nurture-sage-dark">
              Private · only you
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-nurture-charcoal">
              {app?.title ?? "Wellness journal"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-nurture-charcoal/65">
              Your journey unfolds on one timeline — photos, reminders, check-ins,
              and notes along the way.
            </p>
          </div>
        </div>
        {profile?.maternalStage ? (
          <p className="mt-4 text-xs text-nurture-sage-dark">
            Current chapter:{" "}
            <span className="font-medium">{formatStageLabel(profile.maternalStage)}</span>
            {profile.dueDate ? ` · due ${profile.dueDate}` : ""}
          </p>
        ) : null}
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanel(panel === "add" ? "none" : "add")}
          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-nurture-sage-dark"
        >
          + Add to timeline
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "checkin" ? "none" : "checkin")}
          className="rounded-full border border-nurture-sage/25 bg-white px-3 py-2 text-sm text-nurture-sage-dark hover:bg-nurture-cream/50"
        >
          {todayCheckIn ? "Today's check-in" : "Check in today"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingEntry(null);
            setPanel(panel === "write" ? "none" : "write");
          }}
          className="rounded-full border border-nurture-sage/25 bg-white px-3 py-2 text-sm text-nurture-charcoal/70 hover:bg-nurture-cream/50"
        >
          Write a note
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "journey" ? "none" : "journey")}
          className="rounded-full border border-nurture-sage/25 bg-white px-3 py-2 text-sm text-nurture-charcoal/70 hover:bg-nurture-cream/50"
        >
          Your chapter
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-nurture-charcoal/50">Opening your timeline…</p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {!loading && panel === "add" ? (
        <div className="mt-6">
          <JournalTimelineComposer
            profile={profile}
            onSaved={() => void load()}
            onClose={() => setPanel("none")}
          />
        </div>
      ) : null}

      {!loading && panel === "checkin" ? (
        <div className="mt-6">
          <JournalEntryEditor
            entryType="daily_checkin"
            promptText={promptText}
            initial={todayCheckIn}
            onSaved={() => {
              setPanel("none");
              void load();
            }}
            onCancel={() => setPanel("none")}
          />
        </div>
      ) : null}

      {!loading && panel === "write" ? (
        <div className="mt-6">
          <JournalEntryEditor
            entryType="freeform"
            onSaved={() => {
              setPanel("none");
              void load();
            }}
            onCancel={() => setPanel("none")}
          />
        </div>
      ) : null}

      {!loading && panel === "journey" && profile ? (
        <div className="mt-6">
          <JournalProfilePanel profile={profile} onUpdated={() => void load()} />
        </div>
      ) : null}

      {!loading && panel === "entry" && editingEntry ? (
        <div className="mt-6 space-y-3">
          <JournalEntryEditor
            entryType={editingEntry.entryType}
            initial={editingEntry}
            onSaved={() => {
              setEditingEntry(null);
              setPanel("none");
              void load();
            }}
            onCancel={() => {
              setEditingEntry(null);
              setPanel("none");
            }}
          />
          <button
            type="button"
            onClick={() => void handleDelete(editingEntry.id)}
            className="text-xs text-red-700 hover:underline"
          >
            Delete this entry
          </button>
        </div>
      ) : null}

      {!loading ? (
        <div className="mt-8">
          <JournalTimeline
            events={timeline}
            entries={entries}
            profile={profile}
            onOpenEntry={(id) => void openEntry(id)}
          />
        </div>
      ) : null}
    </div>
  );
}
