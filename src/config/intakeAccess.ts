const readPublicIntakeEnv = (value: string | undefined): boolean | null => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return null;
};

/** Public concierge intake without sign-in (default on for marketing CTAs). */
export const isPublicIntakeEnabled = (): boolean => {
  const fromClient = readPublicIntakeEnv(process.env.NEXT_PUBLIC_INTAKE_PUBLIC);
  if (fromClient !== null) return fromClient;
  const fromServer = readPublicIntakeEnv(process.env.INTAKE_PUBLIC);
  if (fromServer !== null) return fromServer;
  return true;
};

export const PUBLIC_INTAKE_PATH = "/intake";

/** @deprecated Use scoped keys below — guest and member sessions must not share storage. */
export const INTAKE_SESSION_STORAGE_KEY = "nurture-intake-session-id";

export const INTAKE_GUEST_SESSION_STORAGE_KEY = "nurture-intake-session-id:guest";

const AUTHENTICATED_INTAKE_PATH = "/apps/dashboard/intake";

export const intakeMemberSessionStorageKey = (userId: string): string =>
  `nurture-intake-session-id:member:${userId}`;

export const resolveIntakeSessionStorageKey = (
  guestMode: boolean,
  userId: string
): string =>
  guestMode
    ? INTAKE_GUEST_SESSION_STORAGE_KEY
    : intakeMemberSessionStorageKey(userId);

export const isMemberIntakePath = (pathname: string): boolean =>
  pathname === AUTHENTICATED_INTAKE_PATH ||
  pathname.startsWith(`${AUTHENTICATED_INTAKE_PATH}/`);

/** Full-height concierge chat routes (hide site footer, lock page scroll). */
export const isIntakeChatPath = (pathname: string): boolean =>
  pathname === PUBLIC_INTAKE_PATH ||
  pathname.startsWith(`${AUTHENTICATED_INTAKE_PATH}/`) ||
  pathname === AUTHENTICATED_INTAKE_PATH;

export const resolveIntakePath = (): string =>
  isPublicIntakeEnabled() ? PUBLIC_INTAKE_PATH : AUTHENTICATED_INTAKE_PATH;

const buildAuthHrefWithReturn = (
  path: "/signin" | "/signup/mom",
  returnTo: string = PUBLIC_INTAKE_PATH
): string => `${path}?returnTo=${encodeURIComponent(returnTo)}`;

export const buildGuestAccountSignupHref = (
  returnTo: string = PUBLIC_INTAKE_PATH
): string => buildAuthHrefWithReturn("/signup/mom", returnTo);

export const buildGuestAccountSigninHref = (
  returnTo: string = PUBLIC_INTAKE_PATH
): string => buildAuthHrefWithReturn("/signin", returnTo);
