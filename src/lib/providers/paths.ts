import {
  buildClientsCrmRootPrefix,
  sanitizeClientSegment,
} from "@/lib/clients/paths";

const PROVIDERS_SEGMENT = "providers/";
const INDEX_SEGMENT = "index/";

/** Providers live under the same deployment-scoped CRM root as clients (crm/dev/ on dev branch). */

export const PROVIDER_FILENAME = "provider.json";

export const sanitizeProviderSegment = sanitizeClientSegment;

export const normalizeProviderNameKey = (name: string): string =>
  sanitizeProviderSegment(name.trim().toLowerCase());

export const buildProvidersRootPrefix = (): string =>
  `${buildClientsCrmRootPrefix()}${PROVIDERS_SEGMENT}`;

/** Providers root for an explicit CRM prefix (cross-env reads). */
export const buildProvidersRootPrefixForCrm = (crmPrefix: string): string => {
  const normalized = crmPrefix.endsWith("/") ? crmPrefix : `${crmPrefix}/`;
  return `${normalized}${PROVIDERS_SEGMENT}`;
};

export const buildProviderListPrefix = (): string => buildProvidersRootPrefix();

export const buildProviderListPrefixForCrm = (crmPrefix: string): string =>
  buildProvidersRootPrefixForCrm(crmPrefix);

export const buildProviderKey = (providerId: string): string =>
  `${buildProvidersRootPrefix()}provider_id=${sanitizeProviderSegment(providerId)}/${PROVIDER_FILENAME}`;

export const buildProviderKeyForCrm = (
  crmPrefix: string,
  providerId: string
): string =>
  `${buildProvidersRootPrefixForCrm(crmPrefix)}provider_id=${sanitizeProviderSegment(providerId)}/${PROVIDER_FILENAME}`;

export const buildProviderByNameIndexKey = (displayName: string): string =>
  `${buildProvidersRootPrefix()}${INDEX_SEGMENT}by_name/${normalizeProviderNameKey(displayName)}.json`;

export const buildProviderByNameIndexKeyForCrm = (
  crmPrefix: string,
  displayName: string
): string =>
  `${buildProvidersRootPrefixForCrm(crmPrefix)}${INDEX_SEGMENT}by_name/${normalizeProviderNameKey(displayName)}.json`;

export const parseProviderIdFromKey = (key: string): string | null => {
  const match = key.match(/providers\/provider_id=([^/]+)\//);
  return match?.[1] ?? null;
};

export interface ProviderIndexEntry {
  providerId: string;
}
