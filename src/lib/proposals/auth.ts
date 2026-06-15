import type { AuthUser } from "@/lib/auth/verifyRequest";
import { canAccessAdminApps } from "@/lib/auth/groups";

/** Coordinators and above may generate and manage proposal drafts. */
export const canGenerateProposals = (user: AuthUser): boolean =>
  canAccessAdminApps(user.groups);

/** Managers and administrators may approve proposals (admin group for now). */
export const canApproveProposals = (user: AuthUser): boolean =>
  canAccessAdminApps(user.groups);

/** Staff who may send signature requests. */
export const canSendProposalForSignature = (user: AuthUser): boolean =>
  canAccessAdminApps(user.groups);

export const canViewSignedProposalArtifacts = (user: AuthUser): boolean =>
  canAccessAdminApps(user.groups);
