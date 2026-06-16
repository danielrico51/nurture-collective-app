/**
 * Replace the body of an existing master Google Doc proposal template.
 *
 * Usage:
 *   GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<doc-id> npm run update:proposal-google-template
 *
 * Defaults to the dev template ID when unset.
 */
import { google } from "googleapis";
import { applyFormattedTemplateToDocument, uploadTemplateLogo } from "../src/lib/proposals/applyFormattedGoogleTemplate";
import { createGoogleProposalDocsAuthClient } from "../src/lib/proposals/googleAuth";
import { PROPOSAL_TEMPLATE_TITLE } from "../src/lib/proposals/proposalDocTemplate";
import { FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS } from "../src/lib/proposals/proposalDocTemplateFormatted";
import {
  bootstrapGoogleCliEnv,
  formatGoogleCliAuthHint,
} from "./lib/bootstrapGoogleCliEnv";

const DEFAULT_DEV_TEMPLATE_ID = "1Ee3fDEn5fUownYxQizjvbxjRju-2qYN5-aTQbSAaKKw";

const documentId =
  process.env.GOOGLE_PROPOSAL_TEMPLATE_DOC_ID?.trim() || DEFAULT_DEV_TEMPLATE_ID;

const main = async () => {
  bootstrapGoogleCliEnv();
  console.log(`Updating formatted proposal Google Doc template ${documentId}…\n`);

  const auth = await createGoogleProposalDocsAuthClient();
  const docs = google.docs({
    version: "v1",
    auth: auth as unknown as Parameters<typeof google.docs>[0]["auth"],
  });
  const drive = google.drive({
    version: "v3",
    auth: auth as unknown as Parameters<typeof google.drive>[0]["auth"],
  });

  console.log("Uploading contract logo to Drive…");
  const logoUri = await uploadTemplateLogo(drive);
  console.log("Applying formatted layout (logo, bold headings, bullet lists)…");

  await applyFormattedTemplateToDocument({
    docs,
    documentId,
    segments: FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS,
    logoUri,
  });

  await drive.files.update({
    fileId: documentId,
    requestBody: { name: PROPOSAL_TEMPLATE_TITLE },
    supportsAllDrives: true,
  });

  console.log("Formatted template updated successfully.\n");
  console.log(`  Document ID : ${documentId}`);
  console.log(`  URL         : https://docs.google.com/document/d/${documentId}/edit`);
  console.log(
    "  Formatting  : centered logo, bold section headings, native bullet lists, bold client/date fields"
  );
  console.log(
    "  Placeholders: {{CLIENT_NAME}}, {{DATE}}, {{SERVICES}}, {{TIMELINE}}, {{PRICING}}, {{TERMS}}, {{NEXT_STEPS}}"
  );
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nFailed to update proposal template:", message);
  console.error("");
  console.error(formatGoogleCliAuthHint(message));
  process.exit(1);
});
