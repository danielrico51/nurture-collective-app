import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import { parseAssigneeList } from "@/lib/tasks/normalize";
import { syncInternalTaskToGoogle } from "@/lib/tasks/googleSync";
import { syncClientTaskToN8n } from "@/lib/tasks/sync";
import type { CreateTaskInput, ManagementTask, TaskCategory } from "@/types/task";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleStorageError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: CreateTaskInput & { assignee?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim();
  const assignees = parseAssigneeList(body.assignees, body.assignee);
  if (!title || assignees.length === 0) {
    return NextResponse.json(
      { error: "Title and at least one responsible person are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const category: TaskCategory =
    body.category === "client" ? "client" : "internal";
  const clientEmail =
    category === "client" ? body.clientEmail?.trim() || null : null;

  const task: ManagementTask = {
    id: randomUUID(),
    title,
    description: body.description?.trim() ?? "",
    assignees,
    dueDate: body.dueDate ?? null,
    urgent: body.urgent ?? false,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.user!.email || auth.user!.sub,
    category,
    clickUpTaskId: null,
    googleTaskId: null,
    googleTaskIdsByUser: {},
    clientEmail,
  };

  try {
    const tasks = await listTasks();
    tasks.unshift(task);
    await saveTasks(tasks);
    const synced = await syncInternalTaskToGoogle(task, "create", auth.user!.email);
    if (synced.googleTaskId && synced.googleTaskId !== task.googleTaskId) {
      tasks[0] = synced;
      await saveTasks(tasks);
    }
    await syncClientTaskToN8n(synced, "create");
    return NextResponse.json({ task: synced }, { status: 201 });
  } catch (error) {
    return handleStorageError(error);
  }
}
