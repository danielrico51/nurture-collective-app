import type { ClassRegistrationSource } from "@/types/classRegistration";

export const CLASS_REGISTRATION_SOURCE_STORAGE_KEY = "class_registration_source";

export const GOOGLE_BUSINESS_REGISTRATION_SOURCE =
  "google_business" as const satisfies ClassRegistrationSource;

type SearchParamsLike = {
  get(name: string): string | null;
};

export const resolveRegistrationSourceFromSearchParams = (
  params: SearchParamsLike
): ClassRegistrationSource | null => {
  const source = params.get("source")?.trim().toLowerCase();
  const utmSource = params.get("utm_source")?.trim().toLowerCase();

  if (
    source === GOOGLE_BUSINESS_REGISTRATION_SOURCE ||
    utmSource === GOOGLE_BUSINESS_REGISTRATION_SOURCE
  ) {
    return GOOGLE_BUSINESS_REGISTRATION_SOURCE;
  }

  return null;
};

export const appendRegistrationSourceToPath = (
  path: string,
  source: ClassRegistrationSource = GOOGLE_BUSINESS_REGISTRATION_SOURCE
): string => {
  const [pathname, existingQuery = ""] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("source", source);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const readStoredRegistrationSource = (): ClassRegistrationSource | null => {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage
    .getItem(CLASS_REGISTRATION_SOURCE_STORAGE_KEY)
    ?.trim();
  if (stored === GOOGLE_BUSINESS_REGISTRATION_SOURCE) {
    return GOOGLE_BUSINESS_REGISTRATION_SOURCE;
  }
  return null;
};

export const storeRegistrationSource = (source: ClassRegistrationSource): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CLASS_REGISTRATION_SOURCE_STORAGE_KEY, source);
};
