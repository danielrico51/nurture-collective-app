import type { ClientNote, ClientNoteType } from "@/types/client";
import type { CoordinatorNote, CoordinatorNoteType } from "@/types/lead";

export const LEAD_NOTE_IMPORT_PREFIX = "[Lead CRM";

const COORDINATOR_NOTE_LABELS: Record<CoordinatorNoteType, string> = {
  general: "General",
  call_log: "Call log",
  prep: "Prep",
  follow_up: "Follow-up",
};

const mapLeadNoteType = (type: CoordinatorNoteType): ClientNoteType => {
  switch (type) {
    case "call_log":
      return "call_log";
    case "follow_up":
      return "follow_up";
    default:
      return "general";
  }
};

const formatNoteDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const truncate = (value: string, maxLength: number): string => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
};

export const clientNotesIncludeLeadImport = (notes: ClientNote[]): boolean =>
  notes.some((note) => note.body.startsWith(LEAD_NOTE_IMPORT_PREFIX));

export const isImportedLeadClientNote = (note: ClientNote): boolean =>
  note.body.startsWith(LEAD_NOTE_IMPORT_PREFIX);

export const formatImportedLeadNoteBody = (note: CoordinatorNote): string => {
  const label = COORDINATOR_NOTE_LABELS[note.type] ?? note.type;
  return `${LEAD_NOTE_IMPORT_PREFIX} · ${label} · ${formatNoteDate(note.createdAt)}]\n${note.body.trim()}`;
};

export const buildLeadNotesSummary = (
  notes: CoordinatorNote[]
): string | null => {
  if (!notes.length) return null;

  const counts = notes.reduce<Record<string, number>>((acc, note) => {
    const label = COORDINATOR_NOTE_LABELS[note.type] ?? note.type;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const countLine = Object.entries(counts)
    .map(([label, count]) => `${count} ${label.toLowerCase()}`)
    .join(", ");

  const recent = [...notes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3)
    .map((note) => {
      const label = COORDINATOR_NOTE_LABELS[note.type] ?? note.type;
      return `• ${label} (${formatNoteDate(note.createdAt)}): ${truncate(note.body, 140)}`;
    })
    .join("\n");

  return `${notes.length} coordinator note${notes.length === 1 ? "" : "s"} from Lead CRM — ${countLine}.\n\nMost recent:\n${recent}`;
};

export const coordinatorNoteTypeLabel = (
  type: CoordinatorNoteType
): string => COORDINATOR_NOTE_LABELS[type] ?? type;

export const leadNoteToClientNoteType = mapLeadNoteType;
