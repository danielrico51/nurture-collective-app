import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import { parseAssigneeList } from "@/lib/tasks/normalize";
import type { UpdateTaskInput } from "@/types/task";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  let body: UpdateTaskInput & { assignee?: string };
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
    const assignees =
      body.assignees !== undefined || body.assignee !== undefined
        ? parseAssigneeList(body.assignees, body.assignee)
        : current.assignees;

    if (assignees.length === 0) {
      return NextResponse.json(
        { error: "At least one responsible person is required" },
        { status: 400 }
      );
    }

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
      assignees,
      dueDate: body.dueDate !== undefined ? body.dueDate : current.dueDate,
      urgent: body.urgent !== undefined ? body.urgent : current.urgent,
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
