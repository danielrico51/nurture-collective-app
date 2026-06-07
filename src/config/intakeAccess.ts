/** Dev/demo: allow intake chat without Cognito sign-in. Never enable in production. */
export const isPublicIntakeEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_INTAKE_PUBLIC === "true" ||
  process.env.INTAKE_PUBLIC === "true";

export const PUBLIC_INTAKE_PATH = "/intake";

/** sessionStorage key for resuming the concierge chat in this browser tab. */
export const INTAKE_SESSION_STORAGE_KEY = "nurture-intake-session-id";

const AUTHENTICATED_INTAKE_PATH = "/apps/dashboard/intake";

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
