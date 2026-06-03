import { legalPaths } from "@/content/legal";

const trimTrailingSlash = (url: string): string => url.replace(/\/$/, "");

/** Public site origin for absolute legal URLs (Intuit, OAuth consoles, etc.). */
export const getPublicSiteOrigin = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

/** Use these URLs in QuickBooks / Intuit Developer app settings. */
export const publicLegalUrls = {
  privacyPolicy: `${getPublicSiteOrigin()}${legalPaths.privacyPolicy}`,
  termsOfUse: `${getPublicSiteOrigin()}${legalPaths.termsOfUse}`,
} as const;
