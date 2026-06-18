import { describe, expect, it } from "vitest";
import {
  parseProposalClientId,
  parseProposalIdFromKey,
  rewriteProposalKeyForClient,
  rewriteProposalMetadataForClient,
} from "@/lib/clients/migration";
import { parseClientIdFromKey } from "@/lib/clients/paths";
import type { ProposalMetadata } from "@/types/proposal";

const sampleMetadata = (overrides: Partial<ProposalMetadata> = {}): ProposalMetadata => ({
  proposal_id: "prop-1",
  client_id: "lead-123",
  lead_id: "lead-123",
  status: "UNDER_REVIEW",
  google_doc_id: null,
  google_doc_url: null,
  signature_request_id: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  approved_at: null,
  approved_by: null,
  sent_at: null,
  signed_at: null,
  version: 1,
  service_tags: [],
  ...overrides,
});

describe("parseClientIdFromKey", () => {
  it("extracts client id from prod-scoped keys", () => {
    expect(
      parseClientIdFromKey("crm/clients/client_id=abc/profile/file.json")
    ).toBe("abc");
  });

  it("extracts client id from dev-scoped keys", () => {
    expect(
      parseClientIdFromKey("crm/dev/clients/client_id=abc/profile/file.json")
    ).toBe("abc");
  });
});

describe("parseProposalClientId", () => {
  it("extracts the client segment from a proposal key", () => {
    expect(
      parseProposalClientId(
        "clients/client_id=lead-123/proposals/proposal_id=p1/metadata.json"
      )
    ).toBe("lead-123");
  });

  it("returns null for CRM client keys", () => {
    expect(parseProposalClientId("crm/clients/client_id=abc/profile.json")).toBeNull();
  });
});

describe("parseProposalIdFromKey", () => {
  it("extracts the proposal id when present", () => {
    expect(
      parseProposalIdFromKey(
        "clients/client_id=lead-123/proposals/proposal_id=p1/metadata.json"
      )
    ).toBe("p1");
  });

  it("returns null when there is no proposal id", () => {
    expect(parseProposalIdFromKey("clients/client_id=lead-123/")).toBeNull();
  });
});

describe("rewriteProposalKeyForClient", () => {
  it("replaces only the client id segment", () => {
    const key =
      "clients/client_id=lead-123/proposals/proposal_id=p1/metadata.json";
    expect(rewriteProposalKeyForClient(key, "lead-123", "NEW-UUID")).toBe(
      "clients/client_id=new-uuid/proposals/proposal_id=p1/metadata.json"
    );
  });

  it("sanitizes the new client id", () => {
    const key = "clients/client_id=old/proposals/proposal_id=p1/draft.json";
    expect(rewriteProposalKeyForClient(key, "old", "AB CD!!")).toBe(
      "clients/client_id=ab_cd_/proposals/proposal_id=p1/draft.json"
    );
  });
});

describe("rewriteProposalMetadataForClient", () => {
  it("repoints client_id and preserves the lead linkage", () => {
    const result = rewriteProposalMetadataForClient(
      sampleMetadata(),
      "client-uuid"
    );
    expect(result.client_id).toBe("client-uuid");
    expect(result.lead_id).toBe("lead-123");
  });

  it("falls back to the previous client_id when lead_id is empty", () => {
    const result = rewriteProposalMetadataForClient(
      sampleMetadata({ lead_id: "" }),
      "client-uuid"
    );
    expect(result.lead_id).toBe("lead-123");
  });
});
