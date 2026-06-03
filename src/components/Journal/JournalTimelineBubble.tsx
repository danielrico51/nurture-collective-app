"use client";

import type { TimelineItem } from "@/lib/journal/timelineModel";
import { MOOD_LABELS } from "@/lib/api/journalClient";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};

export function JournalTimelineBubble({
  item,
  onOpenEntry,
}: {
  item: TimelineItem;
  onOpenEntry?: (entryId: string) => void;
}) {
  const dateLabel = formatDate(item.sortAt);

  if (item.kind === "memory" && item.imageUrl) {
    return (
      <article className="flex gap-4">
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-md ring-2 ring-nurture-sage/30 sm:h-24 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-nurture-sage/10">
          <p className="text-[11px] font-medium text-nurture-sage-dark">{dateLabel}</p>
          <p className="mt-0.5 font-serif text-base text-nurture-charcoal">{item.title}</p>
          {item.body ? (
            <p className="mt-1 text-sm text-nurture-charcoal/65 whitespace-pre-wrap">
              {item.body}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  if (item.kind === "reminder") {
    return (
      <article className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-400/60 bg-amber-50 text-lg shadow-sm">
          🔔
        </div>
        <div className="min-w-0 flex-1 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3">
          <p className="text-[11px] font-medium text-amber-800/80">{dateLabel}</p>
          <p className="mt-0.5 text-sm font-semibold text-amber-950">{item.title}</p>
          {item.reminderAt ? (
            <p className="mt-1 text-xs text-amber-900/70">
              Reminder for {formatDate(item.reminderAt)}
            </p>
          ) : null}
          {item.body ? (
            <p className="mt-1 text-sm text-amber-950/75">{item.body}</p>
          ) : null}
        </div>
      </article>
    );
  }

  if (item.kind === "checkin" || item.kind === "journal") {
    const clickable = Boolean(item.entryId && onOpenEntry);
    return (
      <article className="ml-6">
        <button
          type="button"
          disabled={!clickable}
          onClick={() => item.entryId && onOpenEntry?.(item.entryId)}
          className={`w-full rounded-2xl border border-nurture-sage/15 bg-white/90 px-4 py-3 text-left shadow-sm transition ${
            clickable ? "hover:border-nurture-sage/35 hover:bg-nurture-cream/40" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-nurture-charcoal/45">{dateLabel}</p>
            {item.mood ? (
              <span className="text-[10px] font-medium text-nurture-sage-dark">
                {MOOD_LABELS[item.mood as keyof typeof MOOD_LABELS]}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-serif text-sm text-nurture-charcoal">{item.title}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-nurture-charcoal/40">
            {item.kind === "checkin" ? "Daily check-in" : "Journal entry"}
          </p>
        </button>
      </article>
    );
  }

  return (
    <article className="flex gap-3">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-nurture-sage/50" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-nurture-charcoal/45">{dateLabel}</p>
        <p className="text-sm font-medium capitalize text-nurture-charcoal">
          {item.title}
        </p>
        {item.body ? (
          <p className="mt-0.5 text-xs text-nurture-charcoal/60">{item.body}</p>
        ) : null}
      </div>
    </article>
  );
}
