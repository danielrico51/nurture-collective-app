/**
 * Verify Google Docs/Drive delegation for proposal generation.
 *
 * Usage:
 *   GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<doc-id> npm run verify:proposal-docs
 */
import { google } from "googleapis";
import {
  GOOGLE_PROPOSAL_DOCS_SCOPE_STRING,
  createGoogleProposalDocsAuthClient,
} from "../src/lib/proposals/googleAuth";
import { PROPOSAL_TEMPLATE_PLACEHOLDERS } from "../src/lib/proposals/proposalDocTemplate";
import {
  bootstrapGoogleCliEnv,
  formatGoogleCliAuthHint,
} from "./lib/bootstrapGoogleCliEnv";

const templateId = process.env.GOOGLE_PROPOSAL_TEMPLATE_DOC_ID?.trim() || "";

const main = async () => {
  const authInfo = bootstrapGoogleCliEnv();
  console.log("Verifying proposal Google Docs credentials…\n");
  console.log(`  Delegated user : ${process.env.GOOGLE_CALENDAR_DELEGATED_USER}`);
  console.log(`  Service account: ${process.env.GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT}`);
  if (authInfo.adcFile) {
    console.log(`  ADC file       : ${authInfo.adcFile} (${authInfo.credentialType ?? "unreadable"})`);
  }
  console.log(`  Auth mode      : ${process.env.GOOGLE_CALENDAR_AUTH_MODE}`);
  console.log(`  Scopes         : ${GOOGLE_PROPOSAL_DOCS_SCOPE_STRING}`);
  console.log(`  Template ID    : ${templateId || "(not set — auth-only check)"}`);
  console.log("");

  const auth = await createGoogleProposalDocsAuthClient();
  const drive = google.drive({
    version: "v3",
    auth: auth as unknown as Parameters<typeof google.drive>[0]["auth"],
  });
  const docs = google.docs({
    version: "v1",
    auth: auth as unknown as Parameters<typeof google.docs>[0]["auth"],
  });

  if (!templateId) {
    console.log("OK [auth]: Delegation token acquired (template ID not provided).");
    return;
  }

  const metadata = await drive.files.get({
    fileId: templateId,
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  });
  console.log(`OK [template]: Found "${metadata.data.name}"`);

  const copy = await drive.files.copy({
    fileId: templateId,
    requestBody: { name: `Proposal verify ${new Date().toISOString()}` },
    supportsAllDrives: true,
    fields: "id",
  });
  const copyId = copy.data.id;
  if (!copyId) throw new Error("Drive copy did not return an id");
  console.log("OK [copy]: Template copy succeeded");

  await docs.documents.batchUpdate({
    documentId: copyId,
    requestBody: {
      requests: PROPOSAL_TEMPLATE_PLACEHOLDERS.map((key) => ({
        replaceAllText: {
          containsText: { text: `{{${key}}}`, matchCase: true },
          replaceText: `[verified:${key}]`,
        },
      })),
    },
  });
  console.log("OK [placeholders]: All template placeholders replaced");

  await drive.files.delete({ fileId: copyId, supportsAllDrives: true });
  console.log("OK [cleanup]: Verification copy deleted");
  console.log("\nProposal Google Docs integration is ready.");
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nFAIL:", message);
  console.error("");
  console.error(formatGoogleCliAuthHint(message));
  process.exit(1);
});
