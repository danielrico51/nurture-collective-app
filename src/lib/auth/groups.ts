/** Cognito group required for /admin and admin APIs. */
export const ADMIN_COGNITO_GROUP = "admin";

/** Cognito group assigned automatically when a user completes app sign-up. */
export const CLIENTS_COGNITO_GROUP = "clients";

const getManagementGroupEnv = (): string | undefined => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_MANAGEMENT_COGNITO_GROUP?.trim() || undefined;
  }
  return process.env.MANAGEMENT_COGNITO_GROUP?.trim() || undefined;
};

/** Resolved group name used for access checks and listing assignees. */
export const getTasksAccessGroup = (): string =>
  getManagementGroupEnv() ?? ADMIN_COGNITO_GROUP;

/** Whether the user may access the admin workspace and its apps. */
export const canAccessAdminApps = (groups: string[]): boolean => {
  const required = getTasksAccessGroup().toLowerCase();
  return groups.some((group) => group.toLowerCase() === required);
};

/** @deprecated Use canAccessAdminApps */
export const canAccessManagementTasks = canAccessAdminApps;
