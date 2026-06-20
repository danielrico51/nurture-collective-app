const STORAGE_PREFIX = "hasSeenTour";

/** Build a per-app storage key. Providers uses `hasSeenTour:providers`. */
export const buildTourStorageKey = (tourId: string): string =>
  tourId ? `${STORAGE_PREFIX}:${tourId}` : STORAGE_PREFIX;

export const hasSeenTour = (storageKey: string): boolean => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(storageKey) === "true";
};

export const markTourSeen = (storageKey: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, "true");
};

/** Dev helper — clear a tour so it runs again on next visit. */
export const resetTourSeen = (storageKey: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
};
