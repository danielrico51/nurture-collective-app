"use client";

import {
  formatMonthYear,
  getMonthGrid,
  groupTasksByDueDate,
  isToday,
  toDateKey,
  WEEKDAY_LABELS,
} from "@/lib/tasks/calendar";
import { dueStatusStyles, getDueStatus } from "@/lib/tasks/utils";
import type { ManagementTask } from "@/types/task";
import { useMemo, useState } from "react";
import UrgentFlag from "./UrgentFlag";

interface TaskCalendarProps {
  tasks: ManagementTask[];
  onTaskClick: (task: ManagementTask) => void;
  onDayClick: (dateKey: string) => void;
}

const MAX_VISIBLE_TASKS = 3;

const TaskCalendar = ({ tasks, onTaskClick, onDayClick }: TaskCalendarProps) => {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const { byDate, undated } = useMemo(
    () => groupTasksByDueDate(tasks),
    [tasks]
  );

  const monthCells = useMemo(() => getMonthGrid(viewDate), [viewDate]);
  const monthLabel = formatMonthYear(viewDate);

  const goToPreviousMonth = () => {
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-nurture-sage/20 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded-full border border-nurture-sage/25 p-2 text-nurture-charcoal/70 transition hover:bg-nurture-cream hover:text-nurture-sage-dark"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="min-w-[10rem] text-center font-serif text-xl font-semibold text-nurture-charcoal">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-full border border-nurture-sage/25 p-2 text-nurture-charcoal/70 transition hover:bg-nurture-cream hover:text-nurture-sage-dark"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-full border border-nurture-sage/25 px-4 py-2 text-sm font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10"
        >
          Today
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-nurture-sage/15 bg-nurture-cream/60">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[7.5rem] border-b border-r border-nurture-sage/10 bg-nurture-cream/20 last:border-r-0"
                />
              );
            }

            const dateKey = toDateKey(date);
            const dayTasks = byDate.get(dateKey) ?? [];
            const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
            const hiddenCount = dayTasks.length - visibleTasks.length;
            const today = isToday(date);

            return (
              <div
                key={dateKey}
                className={`group min-h-[7.5rem] border-b border-r border-nurture-sage/10 p-2 last:border-r-0 ${
                  today ? "bg-nurture-sage/8" : "bg-white"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                      today
                        ? "bg-nurture-sage text-white"
                        : "text-nurture-charcoal/80"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDayClick(dateKey)}
                    aria-label={`Add task on ${date.toLocaleDateString()}`}
                    className="rounded-md p-1 text-nurture-charcoal/0 transition group-hover:text-nurture-sage-dark hover:bg-nurture-sage/10 group-hover:text-nurture-sage-dark"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>

                <ul className="space-y-1">
                  {visibleTasks.map((task) => {
                    const dueStatus = getDueStatus(task.dueDate, task.completed);
                    const styles = dueStatusStyles[dueStatus];

                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => onTaskClick(task)}
                          className={`flex w-full items-start gap-1 rounded-md px-1.5 py-1 text-left text-xs transition hover:opacity-90 ${
                            task.completed
                              ? "bg-nurture-charcoal/5 text-nurture-charcoal/50 line-through"
                              : task.urgent
                                ? "bg-red-100 text-red-900"
                                : `${styles.badge}`
                          }`}
                        >
                          {task.urgent && !task.completed ? (
                            <UrgentFlag active className="mt-0.5 h-3 w-3 shrink-0" />
                          ) : null}
                          <span className="line-clamp-2">{task.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {hiddenCount > 0 ? (
                  <p className="mt-1 px-1.5 text-[10px] font-medium text-nurture-sage-dark">
                    +{hiddenCount} more
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 ? (
        <div className="rounded-2xl border border-nurture-sage/20 bg-white p-5 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            No deadline
          </h3>
          <p className="mt-1 text-sm text-nurture-charcoal/60">
            {undated.length} task{undated.length === 1 ? "" : "s"} without a due date
          </p>
          <ul className="mt-4 space-y-2">
            {undated.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition hover:shadow-sm ${
                    task.completed
                      ? "border-nurture-sage/15 bg-nurture-cream/40 text-nurture-charcoal/50 line-through"
                      : task.urgent
                        ? "border-red-200 bg-red-50/50 text-red-900"
                        : "border-nurture-sage/20 bg-white text-nurture-charcoal"
                  }`}
                >
                  {task.urgent && !task.completed ? (
                    <UrgentFlag active className="h-4 w-4 shrink-0" />
                  ) : null}
                  <span className="truncate">{task.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default TaskCalendar;
