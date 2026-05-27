/** Smart entry point — auth-aware redirect to intake or sign-in. */
import { resolveIntakePath } from "@/config/intakeAccess";
import type { SupportInterest } from "@/types/intake";

export const CARE_START_PATH = "/care/start";

export const INTAKE_PATH = resolveIntakePath();

export const CARE_SERVICE_STORAGE_KEY = "nurture-care-service";

export const buildCareStartHref = (service?: string) =>
  service
    ? `${CARE_START_PATH}?service=${encodeURIComponent(service)}`
    : CARE_START_PATH;

export const buildIntakeHref = (service?: string) =>
  service
    ? `${INTAKE_PATH}?service=${encodeURIComponent(service)}`
    : INTAKE_PATH;

/** Maps marketing service slugs to intake support interests. */
const SERVICE_SLUG_TO_INTEREST: Record<string, SupportInterest> = {
  "birth-doula": "birth-doula",
  "overnight-newborn": "postpartum-doula",
  "postpartum-care": "postpartum-doula",
  lactation: "lactation",
  "prenatal-massage": "general-support",
};

export const getSupportInterestFromServiceSlug = (
  slug: string
): SupportInterest | null => SERVICE_SLUG_TO_INTEREST[slug] ?? null;

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
