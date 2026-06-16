import type { docs_v1 } from "googleapis";
import type { FormattedTemplateSegment } from "@/lib/proposals/proposalDocTemplateFormatted";

type ParagraphRecord = {
  start: number;
  end: number;
  segment: FormattedTemplateSegment;
};

const segmentText = (segment: FormattedTemplateSegment): string | null => {
  switch (segment.kind) {
    case "logo":
    case "spacer":
      return null;
    case "placeholder":
      return `{{${segment.name}}}`;
    default:
      return segment.text;
  }
};

const isBoldSegment = (segment: FormattedTemplateSegment): boolean => {
  if (segment.kind === "bold-line") return true;
  if (segment.kind === "bullet") return Boolean(segment.bold);
  if (segment.kind === "placeholder") {
    return (
      segment.bold === true ||
      segment.name === "DATE" ||
      segment.name === "CLIENT_NAME" ||
      segment.name === "NEXT_STEPS"
    );
  }
  return false;
};

export type FormattedTemplateBuildResult = {
  insertRequests: docs_v1.Schema$Request[];
  formatRequests: docs_v1.Schema$Request[];
};

export const buildFormattedTemplateRequests = (input: {
  segments: FormattedTemplateSegment[];
  logoUri?: string;
  logoWidthPt?: number;
  logoHeightPt?: number;
}): FormattedTemplateBuildResult => {
  const insertRequests: docs_v1.Schema$Request[] = [];
  const paragraphRecords: ParagraphRecord[] = [];
  let index = 1;

  for (const segment of input.segments) {
    if (segment.kind === "logo") {
      if (input.logoUri) {
        insertRequests.push({
          insertInlineImage: {
            location: { index },
            uri: input.logoUri,
            objectSize: {
              width: {
                magnitude: input.logoWidthPt ?? 216,
                unit: "PT",
              },
              height: {
                magnitude: input.logoHeightPt ?? 72,
                unit: "PT",
              },
            },
          },
        });
        index += 1;
        const paragraphStart = index;
        insertRequests.push({
          insertText: { location: { index }, text: "\n" },
        });
        index += 1;
        paragraphRecords.push({
          start: paragraphStart,
          end: index,
          segment: { kind: "spacer" },
        });
      }
      continue;
    }

    if (segment.kind === "spacer") {
      insertRequests.push({
        insertText: { location: { index }, text: "\n" },
      });
      index += 1;
      continue;
    }

    const text = segmentText(segment);
    if (!text) continue;

    const line = `${text}\n`;
    const start = index;
    const end = index + line.length;
    insertRequests.push({
      insertText: { location: { index }, text: line },
    });
    paragraphRecords.push({ start, end, segment });
    index = end;
  }

  const formatRequests: docs_v1.Schema$Request[] = [];

  for (const record of paragraphRecords) {
    const contentEnd = Math.max(record.start, record.end - 1);
    if (!isBoldSegment(record.segment)) continue;
    formatRequests.push({
      updateTextStyle: {
        range: { startIndex: record.start, endIndex: contentEnd },
        textStyle: { bold: true },
        fields: "bold",
      },
    });
  }

  if (input.logoUri) {
    formatRequests.push({
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: 2 },
        paragraphStyle: { alignment: "CENTER" },
        fields: "alignment",
      },
    });
  }

  let bulletRun: {
    list: FormattedTemplateSegment & { kind: "bullet" };
    start: number;
    end: number;
  } | null = null;

  const flushBullets = () => {
    if (!bulletRun) return;
    formatRequests.push({
      createParagraphBullets: {
        range: { startIndex: bulletRun.start, endIndex: bulletRun.end },
        bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
      },
    });
    bulletRun = null;
  };

  for (const record of paragraphRecords) {
    if (record.segment.kind === "bullet") {
      if (bulletRun && bulletRun.list.list === record.segment.list) {
        bulletRun.end = record.end;
      } else {
        flushBullets();
        bulletRun = {
          list: record.segment,
          start: record.start,
          end: record.end,
        };
      }
      continue;
    }
    flushBullets();
  }
  flushBullets();

  return { insertRequests, formatRequests };
};

export const clearDocumentBodyRequests = (
  endIndex: number
): docs_v1.Schema$Request[] => {
  if (endIndex <= 2) return [];
  return [
    {
      deleteContentRange: {
        range: { startIndex: 1, endIndex: endIndex - 1 },
      },
    },
  ];
};
