import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import type { CreateTaskInput, ManagementTask } from "@/types/task";
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

  let body: CreateTaskInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim();
  const assignee = body.assignee?.trim();
  if (!title || !assignee) {
    return NextResponse.json(
      { error: "Title and assignee are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const task: ManagementTask = {
    id: randomUUID(),
    title,
    description: body.description?.trim() ?? "",
    assignee,
    dueDate: body.dueDate ?? null,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.user!.email || auth.user!.sub,
  };

  try {
    const tasks = await listTasks();
    tasks.unshift(task);
    await saveTasks(tasks);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleStorageError(error);
  }
}
