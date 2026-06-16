import "server-only";

import { google } from "googleapis";
import { createGoogleProposalDocsAuthClient } from "@/lib/proposals/googleAuth";
import { proposalsStorageConfig } from "@/lib/proposals/config";
import type { ProposalLlmContent } from "@/types/proposal";

const getDocsClients = async () => {
  const auth = await createGoogleProposalDocsAuthClient();
  return {
    docs: google.docs({
      version: "v1",
      auth: auth as unknown as Parameters<typeof google.docs>[0]["auth"],
    }),
    drive: google.drive({
      version: "v3",
      auth: auth as unknown as Parameters<typeof google.drive>[0]["auth"],
    }),
  };
};

const formatServices = (content: ProposalLlmContent): string =>
  content.recommended_services
    .map((service) => {
      const frequency = service.frequency ? ` ${service.frequency}.` : "";
      return `• ${service.name}:${frequency} ${service.description}`;
    })
    .join("\n");

const formatDateForContract = (date = new Date()): string =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });

const buildReplacementMap = (
  clientName: string,
  content: ProposalLlmContent
): Record<string, string> => ({
  CLIENT_NAME: clientName,
  DATE: formatDateForContract(),
  SERVICES: formatServices(content),
  PRICING: content.pricing
    .split("\n")
    .map((line) => (line.startsWith("•") ? line : `• ${line}`))
    .join("\n"),
  TIMELINE: content.timeline
    .split("\n")
    .map((line) => (line.startsWith("•") ? line : `• ${line}`))
    .join("\n"),
  TERMS: content.terms,
  NEXT_STEPS: content.next_steps,
});

const replacePlaceholdersInDoc = async (
  documentId: string,
  replacements: Record<string, string>
) => {
  const { docs } = await getDocsClients();
  const requests = Object.entries(replacements).flatMap(([key, value]) => [
    {
      replaceAllText: {
        containsText: { text: `{{${key}}}`, matchCase: true },
        replaceText: value,
      },
    },
  ]);

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
};

export const isGoogleDocsProposalConfigured = (): boolean =>
  Boolean(proposalsStorageConfig.googleTemplateDocId);

export const createProposalGoogleDoc = async (input: {
  clientName: string;
  content: ProposalLlmContent;
}): Promise<{ documentId: string; documentUrl: string }> => {
  const templateId = proposalsStorageConfig.googleTemplateDocId;
  if (!templateId) {
    throw new Error(
      "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID is not configured. Create a master Google Doc template with placeholders first."
    );
  }

  const { drive } = await getDocsClients();
  const title = `Proposal - ${input.clientName} - ${new Date().toISOString().slice(0, 10)}`;

  const copyResponse = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: title,
      parents: proposalsStorageConfig.googleDriveFolderId
        ? [proposalsStorageConfig.googleDriveFolderId]
        : undefined,
    },
    supportsAllDrives: true,
    fields: "id,webViewLink",
  });

  const documentId = copyResponse.data.id;
  if (!documentId) throw new Error("Google Drive copy did not return a document id");

  await replacePlaceholdersInDoc(
    documentId,
    buildReplacementMap(input.clientName, input.content)
  );

  const documentUrl =
    copyResponse.data.webViewLink ??
    `https://docs.google.com/document/d/${documentId}/edit`;

  return { documentId, documentUrl };
};
