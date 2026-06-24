import { describe, expect, it } from "vitest";
import {
  buildLeadNotesSummary,
  clientNotesIncludeLeadImport,
  formatImportedLeadNoteBody,
  LEAD_NOTE_IMPORT_PREFIX,
} from "@/lib/clients/leadNotesShared";
import type { ClientNote } from "@/types/client";
import type { CoordinatorNote } from "@/types/lead";

const sampleLeadNote = (
  overrides: Partial<CoordinatorNote> = {}
): CoordinatorNote => ({
  id: "note-1",
  leadId: "lead-1",
  authorId: "coord-1",
  authorEmail: "alex@example.com",
  body: "Discussed overnight postpartum package and Carrot reimbursement steps.",
  type: "call_log",
  createdAt: "2026-01-15T14:00:00.000Z",
  ...overrides,
});

describe("buildLeadNotesSummary", () => {
  it("summarizes note counts and recent entries", () => {
    const summary = buildLeadNotesSummary([
      sampleLeadNote(),
      sampleLeadNote({
        id: "note-2",
        type: "prep",
        body: "Review hospital bag checklist before consult.",
        createdAt: "2026-01-10T10:00:00.000Z",
      }),
    ]);

    expect(summary).toContain("2 coordinator notes");
    expect(summary).toContain("call log");
    expect(summary).toContain("Most recent:");
    expect(summary).toContain("Carrot reimbursement");
  });
});

describe("lead note import markers", () => {
  it("formats imported note bodies with a lead CRM prefix", () => {
    const body = formatImportedLeadNoteBody(sampleLeadNote());
    expect(body.startsWith(LEAD_NOTE_IMPORT_PREFIX)).toBe(true);
    expect(body).toContain("Call log");
    expect(body).toContain("Carrot reimbursement");
  });

  it("detects previously imported client notes", () => {
    const notes: ClientNote[] = [
      {
        id: "client-note-1",
        clientId: "client-1",
        authorId: "system",
        authorEmail: "",
        body: `${LEAD_NOTE_IMPORT_PREFIX} · Summary]\nImported history`,
        type: "general",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ];

    expect(clientNotesIncludeLeadImport(notes)).toBe(true);
  });
});
