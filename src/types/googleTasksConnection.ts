export interface GoogleTasksUserConnection {
  email: string;
  refreshToken: string;
  taskListId: string | null;
  /** Mirror all internal team tasks (default). Set false to sync only assigned tasks. */
  syncAllTasks: boolean;
  connectedAt: string;
}

export interface GoogleTasksConnectionsDocument {
  version: number;
  connections: GoogleTasksUserConnection[];
  updatedAt: string;
}
