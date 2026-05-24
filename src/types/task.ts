export interface ManagementTask {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  dueDate: string | null;
  urgent: boolean;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TasksDocument {
  version: number;
  tasks: ManagementTask[];
  updatedAt: string;
}

export type TaskFilter = "all" | "active" | "completed";
export type TaskOwnershipFilter = "all" | "mine";
export type TaskViewMode = "board" | "calendar";

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignees: string[];
  dueDate?: string | null;
  urgent?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignees?: string[];
  dueDate?: string | null;
  urgent?: boolean;
  completed?: boolean;
}
