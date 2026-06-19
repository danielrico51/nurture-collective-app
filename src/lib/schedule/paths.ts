import {
  buildClientRootPrefix,
  sanitizeClientSegment,
} from "@/lib/clients/paths";

export const ENGAGEMENT_FILENAME = "engagement.json";
export const PACKAGE_FILENAME = "package.json";
export const EXPECTATION_FILENAME = "expectation.json";
export const SHIFT_FILENAME = "shift.json";
export const PAYOUT_FILENAME = "payout.json";

export const buildEngagementListPrefix = (clientId: string): string =>
  `${buildClientRootPrefix(clientId)}engagements/`;

export const buildEngagementKey = (
  clientId: string,
  engagementId: string
): string =>
  `${buildEngagementListPrefix(clientId)}engagement_id=${sanitizeClientSegment(engagementId)}/${ENGAGEMENT_FILENAME}`;

export const buildPackageListPrefix = (
  clientId: string,
  engagementId: string
): string =>
  `${buildEngagementListPrefix(clientId)}engagement_id=${sanitizeClientSegment(engagementId)}/packages/`;

export const buildPackageKey = (
  clientId: string,
  engagementId: string,
  packageId: string
): string =>
  `${buildPackageListPrefix(clientId, engagementId)}package_id=${sanitizeClientSegment(packageId)}/${PACKAGE_FILENAME}`;

export const buildExpectationListPrefix = (
  clientId: string,
  engagementId: string
): string =>
  `${buildEngagementListPrefix(clientId)}engagement_id=${sanitizeClientSegment(engagementId)}/expectations/`;

export const buildExpectationKey = (
  clientId: string,
  engagementId: string,
  expectationId: string
): string =>
  `${buildExpectationListPrefix(clientId, engagementId)}expectation_id=${sanitizeClientSegment(expectationId)}/${EXPECTATION_FILENAME}`;

export const parseEngagementIdFromKey = (key: string): string | null => {
  const match = key.match(/engagements\/engagement_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const parsePackageIdFromKey = (key: string): string | null => {
  const match = key.match(/packages\/package_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const parseExpectationIdFromKey = (key: string): string | null => {
  const match = key.match(/expectations\/expectation_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const buildShiftListPrefix = (
  clientId: string,
  engagementId: string
): string =>
  `${buildEngagementListPrefix(clientId)}engagement_id=${sanitizeClientSegment(engagementId)}/shifts/`;

export const buildShiftKey = (
  clientId: string,
  engagementId: string,
  shiftId: string
): string =>
  `${buildShiftListPrefix(clientId, engagementId)}shift_id=${sanitizeClientSegment(shiftId)}/${SHIFT_FILENAME}`;

export const buildPayoutListPrefix = (
  clientId: string,
  engagementId: string
): string =>
  `${buildEngagementListPrefix(clientId)}engagement_id=${sanitizeClientSegment(engagementId)}/payouts/`;

export const buildPayoutKey = (
  clientId: string,
  engagementId: string,
  payoutBatchId: string
): string =>
  `${buildPayoutListPrefix(clientId, engagementId)}payout_id=${sanitizeClientSegment(payoutBatchId)}/${PAYOUT_FILENAME}`;

export const parseShiftIdFromKey = (key: string): string | null => {
  const match = key.match(/shifts\/shift_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export const parsePayoutIdFromKey = (key: string): string | null => {
  const match = key.match(/payouts\/payout_id=([^/]+)\//);
  return match?.[1] ?? null;
};
