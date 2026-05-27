import { isPublicIntakeEnabled } from "@/config/intakeAccess";

export const GUEST_SESSION_STORAGE_KEY = "nurture-guest-session-id";

const GUEST_ID_PATTERN = /^guest_[a-z0-9-]+$/i;

export const createGuestSessionId = (): string =>
  `guest_${crypto.randomUUID()}`;

export const isGuestSessionId = (value: string): boolean =>
  GUEST_ID_PATTERN.test(value);

/** Stable anonymous id for public dev intake (sessionStorage). */
export const getOrCreateGuestSessionId = (): string => {
  if (typeof window === "undefined") return createGuestSessionId();
  const existing = window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
  if (existing && isGuestSessionId(existing)) return existing;
  const next = createGuestSessionId();
  window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, next);
  return next;
};

export const clearGuestSessionId = (): void => {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
  }
};

export const canUseGuestIntake = (): boolean => isPublicIntakeEnabled();
