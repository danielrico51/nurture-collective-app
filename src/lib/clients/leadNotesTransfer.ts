import {
  appendLocalClientNote,
  listLocalNotesForClient,
} from "@/lib/clients/localStorage";
import {
  appendS3ClientNote,
  listS3NotesForClient,
} from "@/lib/clients/platformS3";
import { getClientsStorageMode } from "@/lib/clients/config";
import { listLocalNotesForLead } from "@/lib/leads/localStorage";
import { listS3NotesForLead } from "@/lib/leads/platformS3";
import { getLeadsStorageMode } from "@/lib/leads/storage";
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

export const listLeadCoordinatorNotes = async (
  leadId: string
): Promise<CoordinatorNote[]> => {
  const notes =
    getLeadsStorageMode() === "local"
      ? await listLocalNotesForLead(leadId)
      : await listS3NotesForLead(leadId);

  return notes.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

const listClientNotes = async (clientId: string): Promise<ClientNote[]> =>
  getClientsStorageMode() === "local"
    ? listLocalNotesForClient(clientId)
    : listS3NotesForClient(clientId);

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

/** Copy lead coordinator notes into client notes (idempotent). */
export const importLeadCoordinatorNotesToClient = async (
  clientId: string,
  leadId: string,
  author: { id: string; email?: string }
): Promise<number> => {
  const [clientNotes, leadNotes] = await Promise.all([
    listClientNotes(clientId),
    listLeadCoordinatorNotes(leadId),
  ]);

  if (!leadNotes.length || clientNotesIncludeLeadImport(clientNotes)) {
    return 0;
  }

  const summary = buildLeadNotesSummary(leadNotes);
  if (summary) {
    const summaryNote: ClientNote = {
      id: crypto.randomUUID(),
      clientId,
      authorId: author.id,
      authorEmail: author.email ?? "",
      body: `${LEAD_NOTE_IMPORT_PREFIX} · Summary]\n${summary}`,
      type: "general",
      createdAt: new Date().toISOString(),
    };

    if (getClientsStorageMode() === "local") {
      await appendLocalClientNote(summaryNote);
    } else {
      await appendS3ClientNote(summaryNote);
    }
  }

  for (const note of leadNotes) {
    const imported: ClientNote = {
      id: crypto.randomUUID(),
      clientId,
      authorId: author.id,
      authorEmail: author.email ?? note.authorEmail,
      body: formatImportedLeadNoteBody(note),
      type: mapLeadNoteType(note.type),
      createdAt: note.createdAt,
    };

    if (getClientsStorageMode() === "local") {
      await appendLocalClientNote(imported);
    } else {
      await appendS3ClientNote(imported);
    }
  }

  return leadNotes.length;
};

export const coordinatorNoteTypeLabel = (
  type: CoordinatorNoteType
): string => COORDINATOR_NOTE_LABELS[type] ?? type;
