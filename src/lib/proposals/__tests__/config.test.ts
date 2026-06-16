import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getProposalsStorageMode,
  resolveGoogleProposalDriveFolderId,
  resolveGoogleProposalTemplateDocId,
  resolveProposalLibraryPrefix,
} from "@/lib/proposals/config";

describe("resolveProposalLibraryPrefix", () => {
  it("uses legacy prod root on main deployments", () => {
    expect(
      resolveProposalLibraryPrefix({ AMPLIFY_BRANCH: "main", NODE_ENV: "production" })
    ).toBe("proposal-library/");
  });

  it("scopes dev library examples under proposal-library/dev/", () => {
    expect(
      resolveProposalLibraryPrefix({ AMPLIFY_BRANCH: "dev", NODE_ENV: "production" })
    ).toBe("proposal-library/dev/");
  });

  it("honors explicit PROPOSAL_LIBRARY_S3_PREFIX overrides", () => {
    expect(
      resolveProposalLibraryPrefix({
        PROPOSAL_LIBRARY_S3_PREFIX: "custom/library/",
        AMPLIFY_BRANCH: "dev",
      })
    ).toBe("custom/library/");
  });
});

describe("resolveGoogleProposalDriveFolderId", () => {
  it("uses dev folder on dev deployments", () => {
    expect(
      resolveGoogleProposalDriveFolderId({
        AMPLIFY_BRANCH: "dev",
        GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV: "dev-folder-id",
        GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_PROD: "prod-folder-id",
      })
    ).toBe("dev-folder-id");
  });

  it("uses prod folder on main deployments", () => {
    expect(
      resolveGoogleProposalDriveFolderId({
        AMPLIFY_BRANCH: "main",
        GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV: "dev-folder-id",
        GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_PROD: "prod-folder-id",
      })
    ).toBe("prod-folder-id");
  });

  it("honors explicit GOOGLE_PROPOSAL_DRIVE_FOLDER_ID override", () => {
    expect(
      resolveGoogleProposalDriveFolderId({
        AMPLIFY_BRANCH: "dev",
        GOOGLE_PROPOSAL_DRIVE_FOLDER_ID: "override-id",
        GOOGLE_PROPOSAL_DRIVE_FOLDER_ID_DEV: "dev-folder-id",
      })
    ).toBe("override-id");
  });
});

describe("resolveGoogleProposalTemplateDocId", () => {
  it("uses scoped dev and prod template doc ids", () => {
    expect(
      resolveGoogleProposalTemplateDocId({
        AMPLIFY_BRANCH: "dev",
        GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_DEV: "dev-template",
        GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_PROD: "prod-template",
      })
    ).toBe("dev-template");
    expect(
      resolveGoogleProposalTemplateDocId({
        AMPLIFY_BRANCH: "main",
        GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_DEV: "dev-template",
        GOOGLE_PROPOSAL_TEMPLATE_DOC_ID_PROD: "prod-template",
      })
    ).toBe("prod-template");
  });
});

describe("getProposalsStorageMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses S3 on Amplify dev when the clients bucket is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AMPLIFY_BRANCH", "dev");
    vi.stubEnv("NURTURE_CLIENTS_BUCKET", "nurture-clients-dev-123");
    expect(getProposalsStorageMode()).toBe("s3");
  });

  it("uses local storage on developer machines without a bucket", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NURTURE_CLIENTS_BUCKET", "");
    expect(getProposalsStorageMode()).toBe("local");
  });

  it("forces S3 during local dev when PROPOSALS_USE_S3=true", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NURTURE_CLIENTS_BUCKET", "nurture-clients-dev-123");
    vi.stubEnv("PROPOSALS_USE_S3", "true");
    expect(getProposalsStorageMode()).toBe("s3");
  });

  it("forces local storage when PROPOSALS_USE_LOCAL_STORAGE=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NURTURE_CLIENTS_BUCKET", "nurture-clients-dev-123");
    vi.stubEnv("PROPOSALS_USE_LOCAL_STORAGE", "true");
    expect(getProposalsStorageMode()).toBe("local");
  });
});
