import { isPublicIntakeEnabled } from "@/config/intakeAccess";

/** Toggle public self-service signup. Signup code/routes stay; UI entry points are hidden. */
export const PUBLIC_SIGNUP_ENABLED = true;

/** Allow account creation when public intake is open (save progress funnel). */
export const canCreateMemberAccount = (): boolean =>
  PUBLIC_SIGNUP_ENABLED || isPublicIntakeEnabled();
