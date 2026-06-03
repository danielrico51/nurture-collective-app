"use client";

import { MOOD_LABELS } from "@/lib/api/journalClient";
import type { MoodScale } from "@/types/journal";

const MOODS: MoodScale[] = [1, 2, 3, 4, 5];

export function JournalMoodPicker({
  value,
  onChange,
  label,
}: {
  value: MoodScale | null;
  onChange: (m: MoodScale) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-nurture-charcoal/70">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              value === m
                ? "bg-nurture-sage text-white"
                : "border border-nurture-sage/30 text-nurture-charcoal/70 hover:bg-nurture-cream"
            }`}
          >
            {MOOD_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
