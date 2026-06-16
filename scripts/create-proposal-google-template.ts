/**
 * Create the master Google Doc proposal template in Drive (admin@ delegated).
 *
 * Usage:
 *   npm run setup:proposal-google-template
 */
import { google } from "googleapis";
import {
  applyFormattedTemplateToDocument,
  uploadTemplateLogo,
} from "../src/lib/proposals/applyFormattedGoogleTemplate";
import { createGoogleProposalDocsAuthClient } from "../src/lib/proposals/googleAuth";
import { PROPOSAL_TEMPLATE_TITLE } from "../src/lib/proposals/proposalDocTemplate";
import { FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS } from "../src/lib/proposals/proposalDocTemplateFormatted";
import {
  bootstrapGoogleCliEnv,
  formatGoogleCliAuthHint,
} from "./lib/bootstrapGoogleCliEnv";

const folderId = process.env.GOOGLE_PROPOSAL_DRIVE_FOLDER_ID?.trim() || "";

const main = async () => {
  const authInfo = bootstrapGoogleCliEnv();
  console.log("Creating formatted Nesting Place proposal Google Doc template…");
  if (authInfo.adcFile) {
    console.log(`  ADC file: ${authInfo.adcFile} (${authInfo.credentialType ?? "unreadable"})`);
  }
  console.log(`  Delegated user: ${process.env.GOOGLE_CALENDAR_DELEGATED_USER}`);
  console.log(`  Auth mode: ${process.env.GOOGLE_CALENDAR_AUTH_MODE}`);
  console.log("");

  const auth = await createGoogleProposalDocsAuthClient();
  const docs = google.docs({
    version: "v1",
    auth: auth as unknown as Parameters<typeof google.docs>[0]["auth"],
  });
  const drive = google.drive({
    version: "v3",
    auth: auth as unknown as Parameters<typeof google.drive>[0]["auth"],
  });

  const created = await docs.documents.create({
    requestBody: { title: PROPOSAL_TEMPLATE_TITLE },
  });

  const documentId = created.data.documentId;
  if (!documentId) {
    throw new Error("Google Docs API did not return a document id");
  }

  const logoUri = await uploadTemplateLogo(drive);
  await applyFormattedTemplateToDocument({
    docs,
    documentId,
    segments: FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS,
    logoUri,
  });

  if (folderId) {
    const existingParents = await drive.files.get({
      fileId: documentId,
      fields: "parents",
      supportsAllDrives: true,
    });
    const previousParents = (existingParents.data.parents ?? []).join(",");
    await drive.files.update({
      fileId: documentId,
      addParents: folderId,
      removeParents: previousParents || undefined,
      supportsAllDrives: true,
      fields: "id,parents",
    });
  }

  const link = `https://docs.google.com/document/d/${documentId}/edit`;

  console.log("Formatted template created successfully.\n");
  console.log(`  Document ID : ${documentId}`);
  console.log(`  URL         : ${link}`);
  console.log("");
  console.log("Next:");
  console.log(`  GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=${documentId} \\`);
  console.log("    AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-proposals-env.sh");
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nFailed to create proposal template:", message);
  console.error("");
  console.error(formatGoogleCliAuthHint(message));
  process.exit(1);
});
