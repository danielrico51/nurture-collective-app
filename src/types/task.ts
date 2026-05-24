export interface ManagementTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string | null;
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

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignee: string;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string | null;
  completed?: boolean;
}
