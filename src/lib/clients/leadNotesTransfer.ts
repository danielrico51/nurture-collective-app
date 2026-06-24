import "server-only";

import {
  appendLocalClientNote,
  listLocalNotesForClient,
} from "@/lib/clients/localStorage";
import {
  appendS3ClientNote,
  listS3NotesForClient,
} from "@/lib/clients/platformS3";
import { getClientsStorageMode } from "@/lib/clients/config";
import {
  buildLeadNotesSummary,
  clientNotesIncludeLeadImport,
  formatImportedLeadNoteBody,
  LEAD_NOTE_IMPORT_PREFIX,
  leadNoteToClientNoteType,
} from "@/lib/clients/leadNotesShared";
import { listLocalNotesForLead } from "@/lib/leads/localStorage";
import { listS3NotesForLead } from "@/lib/leads/platformS3";
import { getLeadsStorageMode } from "@/lib/leads/storage";
import type { ClientNote } from "@/types/client";
import type { CoordinatorNote } from "@/types/lead";

export {
  buildLeadNotesSummary,
  clientNotesIncludeLeadImport,
  coordinatorNoteTypeLabel,
  formatImportedLeadNoteBody,
  isImportedLeadClientNote,
  LEAD_NOTE_IMPORT_PREFIX,
} from "@/lib/clients/leadNotesShared";

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
      type: leadNoteToClientNoteType(note.type),
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
