"use client";

import { JournalMoodPicker } from "@/components/Journal/JournalMoodPicker";
import {
  createJournalEntry,
  updateJournalEntry,
} from "@/lib/api/journalClient";
import type { JournalEntry, JournalEntryType, MoodScale } from "@/types/journal";
import { useState } from "react";

const textareaClass =
  "mt-2 w-full min-h-[140px] resize-y rounded-xl border border-nurture-sage/20 bg-white px-4 py-3 font-serif text-base leading-relaxed text-nurture-charcoal placeholder:text-nurture-charcoal/35 focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

export function JournalEntryEditor({
  entryType,
  initial,
  promptText,
  journalDate,
  onSaved,
  onCancel,
}: {
  entryType: JournalEntryType;
  initial?: JournalEntry | null;
  promptText?: string;
  journalDate?: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [mood, setMood] = useState<MoodScale | null>(initial?.mood ?? null);
  const [sleepQuality, setSleepQuality] = useState<MoodScale | null>(
    initial?.sleepQuality ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckIn = entryType === "daily_checkin";

  const submit = async () => {
    if (!body.trim() && !isCheckIn) {
      setError("Write a little something — even one sentence counts.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        entryType,
        journalDate,
        title: title.trim() || null,
        body: body.trim() || (mood ? `Mood: ${mood}` : ""),
        mood,
        sleepQuality: isCheckIn ? sleepQuality : null,
      };
      if (initial) {
        await updateJournalEntry(initial.id, payload);
      } else {
        await createJournalEntry(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-nurture-sage/15 bg-white p-4 shadow-sm sm:p-5">
      {promptText ? (
        <p className="font-serif text-sm italic text-nurture-sage-dark">
          {promptText}
        </p>
      ) : null}

      {!isCheckIn ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="mt-3 w-full border-0 border-b border-nurture-sage/15 bg-transparent py-2 font-serif text-lg text-nurture-charcoal focus:border-nurture-sage focus:outline-none"
        />
      ) : null}

      {isCheckIn ? (
        <div className="mt-4 space-y-4">
          <JournalMoodPicker value={mood} onChange={setMood} label="How are you feeling?" />
          <JournalMoodPicker
            value={sleepQuality}
            onChange={setSleepQuality}
            label="How was sleep?"
          />
        </div>
      ) : null}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          isCheckIn
            ? "A line or two about today…"
            : "This space is only for you…"
        }
        className={textareaClass}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : initial ? "Update entry" : "Save to journal"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm text-nurture-charcoal/70"
          >
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
