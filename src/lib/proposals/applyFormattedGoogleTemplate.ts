import { createReadStream } from "fs";
import { resolve } from "path";
import type { drive_v3, docs_v1 } from "googleapis";
import {
  buildFormattedTemplateRequests,
  clearDocumentBodyRequests,
} from "@/lib/proposals/googleDocTemplateBuilder";
import type { FormattedTemplateSegment } from "@/lib/proposals/proposalDocTemplateFormatted";

const DEFAULT_LOGO_PATH = resolve(
  process.cwd(),
  "proposal-library-seed/assets/postpartum-contract-logo.png"
);

export const uploadTemplateLogo = async (
  drive: drive_v3.Drive,
  logoPath = process.env.PROPOSAL_TEMPLATE_LOGO_PATH?.trim() || DEFAULT_LOGO_PATH
): Promise<string> => {
  const uploaded = await drive.files.create({
    requestBody: {
      name: "tnp-postpartum-contract-logo.png",
      mimeType: "image/png",
    },
    media: {
      mimeType: "image/png",
      body: createReadStream(logoPath),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = uploaded.data.id;
  if (!fileId) {
    throw new Error("Drive upload did not return a file id for the template logo");
  }

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  });

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

export const applyFormattedTemplateToDocument = async (input: {
  docs: docs_v1.Docs;
  documentId: string;
  segments: FormattedTemplateSegment[];
  logoUri?: string;
}): Promise<void> => {
  const doc = await input.docs.documents.get({ documentId: input.documentId });
  const content = doc.data.body?.content ?? [];
  const endIndex =
    content.length > 0
      ? (content[content.length - 1]?.endIndex ?? 1)
      : 1;

  const { insertRequests, formatRequests } = buildFormattedTemplateRequests({
    segments: input.segments,
    logoUri: input.logoUri,
  });

  const requests: docs_v1.Schema$Request[] = [
    ...clearDocumentBodyRequests(endIndex),
    ...insertRequests,
    ...formatRequests,
  ];

  await input.docs.documents.batchUpdate({
    documentId: input.documentId,
    requestBody: { requests },
  });
};
