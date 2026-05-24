import type { ManagementTask } from "@/types/task";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (key: string): Date =>
  new Date(`${key}T12:00:00`);

export const isToday = (date: Date): boolean =>
  toDateKey(date) === toDateKey(new Date());

export const formatMonthYear = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

export const getMonthGrid = (viewDate: Date): (Date | null)[] => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = Array.from({ length: leadingEmpty }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

export const groupTasksByDueDate = (
  tasks: ManagementTask[]
): {
  byDate: Map<string, ManagementTask[]>;
  undated: ManagementTask[];
} => {
  const byDate = new Map<string, ManagementTask[]>();
  const undated: ManagementTask[] = [];

  for (const task of tasks) {
    if (!task.dueDate) {
      undated.push(task);
      continue;
    }

    const existing = byDate.get(task.dueDate) ?? [];
    existing.push(task);
    byDate.set(task.dueDate, existing);
  }

  return { byDate, undated };
};
