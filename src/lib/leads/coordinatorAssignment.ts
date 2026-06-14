import { listTeamMembers } from "@/lib/tasks/members";

export class CoordinatorAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoordinatorAssignmentError";
  }
}

export const resolveCoordinatorAssignment = async (
  coordinatorId: string
): Promise<{ coordinatorId: string; coordinatorEmail: string }> => {
  const trimmed = coordinatorId.trim();
  if (!trimmed) {
    return { coordinatorId: "", coordinatorEmail: "" };
  }

  const members = await listTeamMembers();
  const member = members.find((item) => item.id === trimmed);
  if (!member) {
    throw new CoordinatorAssignmentError("Coordinator not found in admin team");
  }

  return {
    coordinatorId: member.id,
    coordinatorEmail: member.email,
  };
};
