"use client";

import { JournalEntryEditor } from "@/components/Journal/JournalEntryEditor";
import { JournalProfilePanel } from "@/components/Journal/JournalProfilePanel";
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

type Tab = "today" | "entries" | "journey" | "timeline";

export function JournalView() {
  const { ready, loading: authLoading } = useRequireMember();
  const app = getMemberAppById("journal");

  const [tab, setTab] = useState<Tab>("today");
  const [profile, setProfile] = useState<JournalProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntryIndexItem[]>([]);
  const [timeline, setTimeline] = useState<JourneyTimelineEvent[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<JournalEntry | null>(null);
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [composing, setComposing] = useState<"freeform" | "checkin" | null>(null);
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
      setComposing(null);
      setTab("entries");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    try {
      await deleteJournalEntry(id);
      setEditingEntry(null);
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "entries", label: "Entries" },
    { id: "journey", label: "Journey" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="max-w-2xl">
      <header className="rounded-2xl border border-nurture-sage/15 bg-gradient-to-br from-nurture-cream/90 to-white px-5 py-6 sm:px-6">
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
              A calm place for your thoughts — TTC, IVF, pregnancy, postpartum,
              and every stage in between.
            </p>
          </div>
        </div>
        {profile?.maternalStage ? (
          <p className="mt-4 text-xs text-nurture-sage-dark">
            Current chapter:{" "}
            <span className="font-medium capitalize">
              {formatStageLabel(profile.maternalStage)}
            </span>
            {profile.journeyPath ? ` · ${profile.journeyPath}` : ""}
          </p>
        ) : null}
      </header>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-nurture-sage/15 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setComposing(null);
              setEditingEntry(null);
            }}
            className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border border-b-0 border-nurture-sage/20 bg-white text-nurture-sage-dark"
                : "text-nurture-charcoal/55 hover:text-nurture-charcoal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="mt-8 text-sm text-nurture-charcoal/50">Opening your journal…</p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {!loading && tab === "today" ? (
        <div className="mt-6 space-y-4">
          {todayCheckIn && !composing ? (
            <div className="rounded-2xl border border-nurture-sage/20 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-nurture-sage-dark">
                Today&apos;s check-in
              </p>
              <p className="mt-2 font-serif text-sm text-nurture-charcoal whitespace-pre-wrap">
                {todayCheckIn.body}
              </p>
              <button
                type="button"
                onClick={() => void openEntry(todayCheckIn.id)}
                className="mt-3 text-xs font-medium text-nurture-sage-dark hover:underline"
              >
                Edit
              </button>
            </div>
          ) : composing === "checkin" || (!todayCheckIn && composing !== "freeform") ? (
            <JournalEntryEditor
              entryType="daily_checkin"
              promptText={promptText}
              initial={todayCheckIn}
              onSaved={() => {
                setComposing(null);
                void load();
              }}
              onCancel={() => setComposing(null)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-nurture-sage/25 bg-nurture-cream/20 px-4 py-5 text-center">
              <p className="font-serif text-sm italic text-nurture-charcoal/70">
                {promptText}
              </p>
              <button
                type="button"
                onClick={() => setComposing("checkin")}
                className="mt-4 rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                {todayCheckIn ? "Update check-in" : "Write today's check-in"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setComposing("freeform");
              setEditingEntry(null);
            }}
            className="w-full rounded-xl border border-nurture-sage/20 py-3 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-cream/50"
          >
            + Free journal entry
          </button>

          {composing === "freeform" ? (
            <JournalEntryEditor
              entryType="freeform"
              onSaved={() => {
                setComposing(null);
                void load();
                setTab("entries");
              }}
              onCancel={() => setComposing(null)}
            />
          ) : null}
        </div>
      ) : null}

      {!loading && tab === "entries" ? (
        <div className="mt-6 space-y-4">
          {editingEntry ? (
            <>
              <JournalEntryEditor
                entryType={editingEntry.entryType}
                initial={editingEntry}
                onSaved={() => {
                  setEditingEntry(null);
                  void load();
                }}
                onCancel={() => setEditingEntry(null)}
              />
              <button
                type="button"
                onClick={() => void handleDelete(editingEntry.id)}
                className="text-xs text-red-700 hover:underline"
              >
                Delete this entry
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setComposing("freeform")}
                className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white"
              >
                New entry
              </button>
              {composing === "freeform" ? (
                <JournalEntryEditor
                  entryType="freeform"
                  onSaved={() => {
                    setComposing(null);
                    void load();
                  }}
                  onCancel={() => setComposing(null)}
                />
              ) : null}
              {entries.length === 0 ? (
                <p className="text-sm text-nurture-charcoal/55">
                  No entries yet. Start with Today or write something new.
                </p>
              ) : (
                <ul className="divide-y divide-nurture-sage/10 rounded-xl border border-nurture-sage/15 bg-white">
                  {entries.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void openEntry(item.id)}
                        className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-nurture-cream/40"
                      >
                        <span className="text-[11px] text-nurture-charcoal/45">
                          {item.journalDate}
                          {item.entryType === "daily_checkin" ? " · check-in" : ""}
                        </span>
                        <span className="mt-0.5 font-serif text-sm text-nurture-charcoal">
                          {item.titlePreview ?? "Untitled"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : null}

      {!loading && tab === "journey" && profile ? (
        <div className="mt-6">
          <JournalProfilePanel profile={profile} onUpdated={() => void load()} />
        </div>
      ) : null}

      {!loading && tab === "timeline" ? (
        <div className="mt-6">
          {timeline.length === 0 ? (
            <p className="text-sm text-nurture-charcoal/55">
              Milestones will appear when you save your journey or add dates.
            </p>
          ) : (
            <ol className="relative border-l border-nurture-sage/25 pl-5">
              {timeline.map((event) => (
                <li key={event.id} className="mb-6 last:mb-0">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-nurture-sage/40" />
                  <p className="text-[11px] text-nurture-charcoal/45">
                    {new Date(event.occurredAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm font-medium capitalize text-nurture-charcoal">
                    {event.type.replace(/_/g, " ")}
                  </p>
                  {event.payload && typeof event.payload.label === "string" ? (
                    <p className="text-xs text-nurture-charcoal/60">
                      {event.payload.label}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}
