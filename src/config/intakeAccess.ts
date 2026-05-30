/** Dev/demo: allow intake chat without Cognito sign-in. Never enable in production. */
export const isPublicIntakeEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_INTAKE_PUBLIC === "true" ||
  process.env.INTAKE_PUBLIC === "true";

export const PUBLIC_INTAKE_PATH = "/intake";

const AUTHENTICATED_INTAKE_PATH = "/apps/dashboard/intake";

export const resolveIntakePath = (): string =>
  isPublicIntakeEnabled() ? PUBLIC_INTAKE_PATH : AUTHENTICATED_INTAKE_PATH;

export const buildGuestAccountSignupHref = (
  returnTo: string = PUBLIC_INTAKE_PATH
): string =>
  `/signup/mom?returnTo=${encodeURIComponent(returnTo)}`;

export const buildGuestAccountSigninHref = (
  returnTo: string = PUBLIC_INTAKE_PATH
): string =>
  `/signin?returnTo=${encodeURIComponent(returnTo)}`;
