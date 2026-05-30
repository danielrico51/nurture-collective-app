import { fetchAuthSession } from "aws-amplify/auth";
import { fetchIntake } from "@/lib/api/intakeClient";
import { canAccessAdminApps } from "@/lib/auth/groups";
import { extractGroupsFromSession } from "@/lib/auth/sessionGroups";
import { isIntakeComplete } from "@/types/intake";

/** Where to send a member after sign-in (admins always go to dashboard). */
export async function resolveMemberHomePath(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const groups = extractGroupsFromSession(session);
    if (canAccessAdminApps(groups)) {
      return "/admin";
    }
  } catch {
    /* fall through to intake check */
  }

  try {
    const intake = await fetchIntake();
    if (isIntakeComplete(intake.profile?.intakeStatus)) {
      return "/apps/dashboard";
    }
  } catch {
    /* unauthenticated or storage unavailable */
  }

  return "/apps/dashboard/intake";
}

export const hasCompletedIntake = async (): Promise<boolean> => {
  try {
    const intake = await fetchIntake();
    return isIntakeComplete(intake.profile?.intakeStatus);
  } catch {
    return false;
  }
};
