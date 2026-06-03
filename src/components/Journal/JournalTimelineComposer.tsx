"use client";

import { createJournalTimelineEvent } from "@/lib/api/journalClient";
import { uploadJournalTimelinePhoto } from "@/lib/api/journalMediaClient";
import { formatStageLabel } from "@/lib/journal/timeline";
import type { JournalProfile } from "@/types/journal";
import { useRef, useState } from "react";

type ComposerMode = "memory" | "reminder" | "milestone" | null;

export function JournalTimelineComposer({
  profile,
  onSaved,
  onClose,
}: {
  profile: JournalProfile | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ComposerMode>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [reminderAt, setReminderAt] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode(null);
    setLabel("");
    setNote("");
    setPhotoPreview(null);
    setPhotoFile(null);
    setError(null);
  };

  const onPickPhoto = (file: File | null) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!mode) return;
    if (!label.trim() && mode !== "memory") {
      setError("Add a short title for this moment.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (photoFile) {
        imageUrl = await uploadJournalTimelinePhoto(photoFile);
      }

      const type =
        mode === "reminder"
          ? "reminder"
          : mode === "memory"
            ? "memory"
            : "custom_milestone";

      await createJournalTimelineEvent({
        type,
        label: label.trim() || (mode === "memory" ? "A moment" : "Milestone"),
        note: note.trim() || undefined,
        occurredAt: `${occurredAt}T12:00:00.000Z`,
        imageUrl,
        reminderAt: reminderAt ? `${reminderAt}T09:00:00.000Z` : undefined,
        stage: profile?.maternalStage ?? undefined,
      });
      reset();
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!mode) {
    return (
      <div className="rounded-2xl border border-nurture-sage/20 bg-white p-4 shadow-sm">
        <p className="font-serif text-sm text-nurture-charcoal/80">
          Add to your journey line
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("memory")}
            className="rounded-full bg-nurture-sage px-3 py-1.5 text-xs font-semibold text-white hover:bg-nurture-sage-dark"
          >
            + Photo memory
          </button>
          <button
            type="button"
            onClick={() => setMode("reminder")}
            className="rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
          >
            + Reminder
          </button>
          <button
            type="button"
            onClick={() => setMode("milestone")}
            className="rounded-full border border-nurture-sage/25 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-cream/60"
          >
            + Milestone
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs text-nurture-charcoal/45 hover:text-nurture-charcoal"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-nurture-sage/25 bg-white p-4 shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
        {mode === "memory"
          ? "Photo memory"
          : mode === "reminder"
            ? "Stage reminder"
            : "Milestone"}
      </p>
      {profile?.maternalStage ? (
        <p className="mt-1 text-[11px] text-nurture-charcoal/50">
          Chapter: {formatStageLabel(profile.maternalStage)}
        </p>
      ) : null}

      <label className="mt-3 block">
        <span className="text-xs font-medium">Title</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={
            mode === "memory"
              ? "First positive test, anatomy scan…"
              : mode === "reminder"
                ? "Schedule glucose screening"
                : "What happened?"
          }
          className="mt-1 w-full rounded-lg border border-nurture-sage/20 px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-medium">When</span>
        <input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-nurture-sage/20 px-3 py-2 text-sm"
        />
      </label>

      {mode === "reminder" ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium">Remind me on</span>
          <input
            type="date"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200/80 px-3 py-2 text-sm"
          />
        </label>
      ) : null}

      {mode === "memory" ? (
        <div className="mt-3">
          <span className="text-xs font-medium">Photo</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-xs"
            onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
          />
          {photoPreview ? (
            <div className="mt-2 flex justify-center">
              <div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-nurture-sage/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="mt-3 block">
        <span className="text-xs font-medium">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-y rounded-lg border border-nurture-sage/20 px-3 py-2 text-sm font-serif"
        />
      </label>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add to timeline"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full px-3 py-2 text-sm text-nurture-charcoal/60"
        >
          Back
        </button>
      </div>
    </div>
  );
}
