"use client";

import { patchJournalProfile } from "@/lib/api/journalClient";
import {
  JOURNEY_PATH_OPTIONS,
  JOURNEY_STAGE_OPTIONS,
  type JourneyPath,
} from "@/lib/community/journeyStages";
import type { JournalProfile } from "@/types/journal";
import type { MaternalStage } from "@/types/intake";
import { useState } from "react";

const selectClass =
  "mt-1 w-full rounded-lg border border-nurture-sage/25 bg-white px-2.5 py-1.5 text-sm";

export function JournalProfilePanel({
  profile,
  onUpdated,
}: {
  profile: JournalProfile;
  onUpdated: () => void;
}) {
  const [stage, setStage] = useState<MaternalStage | "">(profile.maternalStage ?? "");
  const [journeyPath, setJourneyPath] = useState<JourneyPath | "">(
    profile.journeyPath ?? ""
  );
  const [dueDate, setDueDate] = useState(profile.dueDate ?? "");
  const [postpartumWeeks, setPostpartumWeeks] = useState(
    profile.postpartumWeeks != null ? String(profile.postpartumWeeks) : ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await patchJournalProfile({
        maternalStage: stage || null,
        journeyPath: journeyPath || null,
        dueDate: dueDate || null,
        dueDateSource: dueDate ? "estimated" : null,
        postpartumWeeks: postpartumWeeks ? parseInt(postpartumWeeks, 10) : null,
      });
      setMessage("Journey saved — peer groups can use this for matching.");
      onUpdated();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-nurture-sage/15 bg-nurture-cream/30 px-4 py-4">
      <h3 className="font-serif text-base font-semibold text-nurture-charcoal">
        Your journey
      </h3>
      <p className="mt-1 text-xs text-nurture-charcoal/55">
        Private to you. Updates sync to peer group matching when you save.
      </p>

      <label className="mt-4 block">
        <span className="text-xs font-medium">Where you are</span>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as MaternalStage | "")}
          className={selectClass}
        >
          <option value="">Select…</option>
          {JOURNEY_STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {stage === "trying-to-conceive" ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium">Path</span>
          <select
            value={journeyPath}
            onChange={(e) => setJourneyPath(e.target.value as JourneyPath | "")}
            className={selectClass}
          >
            <option value="">Select…</option>
            {JOURNEY_PATH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {stage === "pregnant" ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium">Due or estimated due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={selectClass}
          />
        </label>
      ) : null}

      {stage === "newly-postpartum" || stage === "infant-care" ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium">Weeks {stage === "infant-care" ? "(baby age)" : "postpartum"}</span>
          <input
            type="number"
            min={0}
            max={104}
            value={postpartumWeeks}
            onChange={(e) => setPostpartumWeeks(e.target.value)}
            className={selectClass}
          />
        </label>
      ) : null}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-4 rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save journey"}
      </button>
      {message ? (
        <p className="mt-2 text-xs text-nurture-sage-dark">{message}</p>
      ) : null}
    </div>
  );
}
