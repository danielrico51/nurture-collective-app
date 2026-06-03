"use client";

import { JournalTimelineBubble } from "@/components/Journal/JournalTimelineBubble";
import {
  buildUnifiedTimeline,
  groupTimelineByStage,
} from "@/lib/journal/timelineModel";
import { formatStageLabel } from "@/lib/journal/timeline";
import type {
  JournalEntryIndexItem,
  JournalProfile,
  JourneyTimelineEvent,
} from "@/types/journal";

export function JournalTimeline({
  events,
  entries,
  profile,
  onOpenEntry,
}: {
  events: JourneyTimelineEvent[];
  entries: JournalEntryIndexItem[];
  profile: JournalProfile | null;
  onOpenEntry?: (entryId: string) => void;
}) {
  const items = buildUnifiedTimeline(events, entries, profile);
  const chapters = groupTimelineByStage(items, profile);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-nurture-sage/30 bg-nurture-cream/25 px-6 py-10 text-center">
        <p className="font-serif text-lg text-nurture-charcoal/75">
          Your journey line starts here
        </p>
        <p className="mt-2 text-sm text-nurture-charcoal/55 max-w-sm mx-auto">
          Add a photo memory, a reminder for an upcoming stage, or save your
          chapter below — everything will gather on this timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {profile?.maternalStage ? (
        <div className="flex items-center gap-2 rounded-full bg-nurture-sage/15 px-4 py-2 text-sm text-nurture-sage-dark w-fit">
          <span className="h-2 w-2 rounded-full bg-nurture-sage animate-pulse" />
          You are here · {formatStageLabel(profile.maternalStage)}
        </div>
      ) : null}

      {chapters.map((chapter) => (
        <section key={`${chapter.stage ?? "open"}-${chapter.label}`}>
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal border-b border-nurture-sage/15 pb-2">
            {chapter.label}
          </h3>
          <ol className="relative mt-6 space-y-8 border-l-2 border-nurture-sage/20 pl-6 sm:pl-8">
            {chapter.items.map((item) => (
              <li key={item.id} className="relative">
                <span
                  className={`absolute -left-[calc(1.5rem+5px)] sm:-left-[calc(2rem+5px)] top-3 h-3 w-3 rounded-full border-2 border-white shadow ${
                    item.kind === "memory"
                      ? "bg-nurture-sage"
                      : item.kind === "reminder"
                        ? "bg-amber-400"
                        : "bg-nurture-sage/40"
                  }`}
                />
                <JournalTimelineBubble item={item} onOpenEntry={onOpenEntry} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
