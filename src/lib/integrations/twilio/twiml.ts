const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildTwimlMessageResponse = (body: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;

export const buildTwimlEmptyResponse = (): string =>
  `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
