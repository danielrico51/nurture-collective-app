/** Smart entry point — auth-aware redirect to intake or sign-in. */
import {
  PUBLIC_INTAKE_PATH,
  resolveIntakePath,
} from "@/config/intakeAccess";
import { SERVICE_SLUGS } from "@/content/site";
import type { SupportInterest } from "@/types/intake";

export const CARE_START_PATH = "/care/start";

export const SERVICES_PATH = "/services";

/** @deprecated Use resolveIntakePath() or buildIntakeHref() — path depends on runtime env. */
export const getIntakePath = (): string => resolveIntakePath();

/** Deep link to a service section on the services hub (e.g. /services#birth-doula). */
export const buildServiceSectionHref = (slug: string) =>
  `${SERVICES_PATH}#${encodeURIComponent(slug)}`;

export const CARE_SERVICE_STORAGE_KEY = "nurture-care-service";

export const buildCareStartHref = (service?: string) =>
  service
    ? `${CARE_START_PATH}?service=${encodeURIComponent(service)}`
    : CARE_START_PATH;

/** Standalone intro-call booking page (SMS / email deep links). */
export const BOOK_INTRO_PATH = "/book";

/** @deprecated Prefer BOOK_INTRO_PATH — kept for legacy book=1 redirects. */
export const buildCareBookingHref = (service?: string) => {
  const params = new URLSearchParams();
  if (service?.trim()) {
    params.set("service", service.trim());
  }
  const query = params.toString();
  return query ? `${BOOK_INTRO_PATH}?${query}` : BOOK_INTRO_PATH;
};

/** Marketing / guest intake — always the public concierge route. */
export const buildPublicIntakeHref = (service?: string) =>
  service
    ? `${PUBLIC_INTAKE_PATH}?service=${encodeURIComponent(service)}`
    : PUBLIC_INTAKE_PATH;

export const buildIntakeHref = (service?: string) => {
  const path = resolveIntakePath();
  return service
    ? `${path}?service=${encodeURIComponent(service)}`
    : path;
};

/** Maps marketing service slugs to intake support interests. */
const SERVICE_SLUG_TO_INTEREST: Record<string, SupportInterest> = {
  "birth-doula": "birth-doula",
  "overnight-newborn": "overnight-newborn-care",
  "postpartum-care": "postpartum-doula",
  lactation: "lactation",
  "prenatal-massage": "prenatal-massage",
  "postpartum-massage": "prenatal-massage",
  "birth-photography": "general-support",
  "childbirth-education": "childbirth-education",
  "placenta-encapsulation": "postpartum-doula",
};

export const getSupportInterestFromServiceSlug = (
  slug: string
): SupportInterest | null => SERVICE_SLUG_TO_INTEREST[slug] ?? null;

export const getServiceTitleFromSlug = (slug: string): string =>
  SERVICE_SLUGS[slug] ?? slug.replace(/-/g, " ");

export interface CareServiceContext {
  slug: string;
  supportInterest: SupportInterest;
  title: string;
}

export const readCareServiceContext = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("service")?.trim();
  const fromStorage = sessionStorage.getItem(CARE_SERVICE_STORAGE_KEY)?.trim();
  if (fromStorage) {
    sessionStorage.removeItem(CARE_SERVICE_STORAGE_KEY);
  }
  return fromUrl || fromStorage || null;
};

export const resolveCareServiceContext = (): CareServiceContext | null => {
  const slug = readCareServiceContext();
  if (!slug) return null;
  const supportInterest = getSupportInterestFromServiceSlug(slug);
  if (!supportInterest) return null;
  return {
    slug,
    supportInterest,
    title: getServiceTitleFromSlug(slug),
  };
};
