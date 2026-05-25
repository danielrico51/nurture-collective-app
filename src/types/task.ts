export type TaskCategory = "internal" | "client";

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
  category: TaskCategory;
  clickUpTaskId: string | null;
  clientEmail: string | null;
}

export interface TasksDocument {
  version: number;
  tasks: ManagementTask[];
  updatedAt: string;
}

export type TaskFilter = "all" | "active" | "urgent" | "completed";
export type TaskOwnershipFilter = "all" | "mine";
export type TaskViewMode = "board" | "calendar";

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignees: string[];
  dueDate?: string | null;
  urgent?: boolean;
  category?: TaskCategory;
  clientEmail?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignees?: string[];
  dueDate?: string | null;
  urgent?: boolean;
  completed?: boolean;
  category?: TaskCategory;
  clientEmail?: string | null;
  clickUpTaskId?: string | null;
}
