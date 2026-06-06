import { NextRequest, NextResponse } from "next/server";
import {
  handleStorageError,
  requireManagementAuth,
} from "@/lib/api/routeHelpers";
import { listTasks, saveTasks } from "@/lib/tasks/storage";
import { parseAssigneeList } from "@/lib/tasks/normalize";
import { syncInternalTaskToGoogle } from "@/lib/tasks/googleSync";
import { syncClientTaskToN8n } from "@/lib/tasks/sync";
import type { TaskCategory, UpdateTaskInput } from "@/types/task";

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
    const category: TaskCategory =
      body.category === "client" || body.category === "internal"
        ? body.category
        : current.category;
    const clientEmail =
      body.clientEmail !== undefined
        ? body.clientEmail?.trim() || null
        : category === "client"
          ? current.clientEmail
          : null;

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
      category,
      clientEmail: category === "client" ? clientEmail : null,
      clickUpTaskId:
        body.clickUpTaskId !== undefined
          ? body.clickUpTaskId
          : current.clickUpTaskId,
      googleTaskId:
        body.googleTaskId !== undefined
          ? body.googleTaskId
          : current.googleTaskId,
    };

    tasks[index] = updated;
    await saveTasks(tasks);
    const synced = await syncInternalTaskToGoogle(
      updated,
      "update",
      auth.user!.email
    );
    if (synced.googleTaskId !== updated.googleTaskId) {
      tasks[index] = synced;
      await saveTasks(tasks);
    }
    await syncClientTaskToN8n(synced, "update");
    return NextResponse.json({ task: synced });
  } catch (error) {
    return handleStorageError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireManagementAuth(request);
  if (auth.error) return auth.error;

  try {
    const tasks = await listTasks();
    const removed = tasks.find((t) => t.id === params.id);
    const next = tasks.filter((t) => t.id !== params.id);
    if (next.length === tasks.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (removed) {
      await syncInternalTaskToGoogle(removed, "delete", auth.user!.email);
    }
    await saveTasks(next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleStorageError(error);
  }
}
