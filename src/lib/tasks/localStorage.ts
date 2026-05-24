import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { TasksDocument } from "@/types/task";

const LOCAL_DIR = path.join(process.cwd(), ".data", "management");
const LOCAL_FILE = path.join(LOCAL_DIR, "tasks.json");

const emptyDocument = (): TasksDocument => ({
  version: 1,
  tasks: [],
  updatedAt: new Date().toISOString(),
});

export const readLocalTasksDocument = async (): Promise<TasksDocument> => {
  try {
    const body = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(body) as TasksDocument;
    if (!Array.isArray(parsed.tasks)) return emptyDocument();
    return parsed;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyDocument();
    throw error;
  }
};

export const writeLocalTasksDocument = async (
  document: TasksDocument
): Promise<void> => {
  await mkdir(LOCAL_DIR, { recursive: true });
  const payload: TasksDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
};
