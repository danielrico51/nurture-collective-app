import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import type { UpdateTaskInput } from "@/types/task";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: UpdateTaskInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const tasks = await listTasks();
    const index = tasks.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const current = tasks[index];
    const now = new Date().toISOString();
    const completed =
      body.completed !== undefined ? body.completed : current.completed;

    const updated = {
      ...current,
      title: body.title?.trim() ?? current.title,
      description:
        body.description !== undefined
          ? body.description.trim()
          : current.description,
      assignee: body.assignee?.trim() ?? current.assignee,
      dueDate: body.dueDate !== undefined ? body.dueDate : current.dueDate,
      completed,
      completedAt: completed
        ? body.completed === true && !current.completed
          ? now
          : current.completedAt ?? now
        : null,
      updatedAt: now,
    };

    tasks[index] = updated;
    await saveTasks(tasks);
    return NextResponse.json({ task: updated });
  } catch (error) {
    return handleStorageError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const tasks = await listTasks();
    const next = tasks.filter((t) => t.id !== params.id);
    if (next.length === tasks.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await saveTasks(next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleStorageError(error);
  }
}
