import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { ManagementTask, TasksDocument } from "@/types/task";
import {
  readLocalTasksDocument,
  writeLocalTasksDocument,
} from "@/lib/tasks/localStorage";
import { normalizeTask } from "@/lib/tasks/normalize";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";

const DEFAULT_KEY = "management/tasks.json";
const DEFAULT_TASKS_BUCKET = "nurture-collective-tasks";

const emptyDocument = (): TasksDocument => ({
  version: 1,
  tasks: [],
  updatedAt: new Date().toISOString(),
});

const isLocalStorageEnabled = () => {
  if (process.env.TASKS_USE_LOCAL_STORAGE === "true") return true;
  if (process.env.TASKS_S3_BUCKET?.trim()) return false;
  return process.env.NODE_ENV === "development";
};

const getS3Client = () => {
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  return new S3Client({
    region,
    credentials: getServerCredentials(),
  });
};

const getBucket = () =>
  process.env.TASKS_S3_BUCKET?.trim() || DEFAULT_TASKS_BUCKET;

const getObjectKey = () => process.env.TASKS_S3_KEY?.trim() || DEFAULT_KEY;

export const getTasksStorageMode = (): "local" | "s3" =>
  isLocalStorageEnabled() ? "local" : "s3";

const readS3TasksDocument = async (): Promise<TasksDocument> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket, Key })
    );
    const body = await response.Body?.transformToString();
    if (!body) return emptyDocument();

    const parsed = JSON.parse(body) as TasksDocument;
    if (!Array.isArray(parsed.tasks)) return emptyDocument();
    return {
      ...parsed,
      tasks: parsed.tasks.map((task) => normalizeTask(task)),
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return emptyDocument();
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      err.name === "NoSuchKey" ||
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return emptyDocument();
    }
    throw error;
  }
};

const writeS3TasksDocument = async (document: TasksDocument): Promise<void> => {
  const client = getS3Client();
  const Bucket = getBucket();
  const Key = getObjectKey();

  const payload: TasksDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

export const readTasksDocument = async (): Promise<TasksDocument> => {
  if (isLocalStorageEnabled()) {
    return readLocalTasksDocument();
  }
  return readS3TasksDocument();
};

export const writeTasksDocument = async (
  document: TasksDocument
): Promise<void> => {
  if (isLocalStorageEnabled()) {
    return writeLocalTasksDocument(document);
  }
  return writeS3TasksDocument(document);
};

export const listTasks = async (): Promise<ManagementTask[]> => {
  const doc = await readTasksDocument();
  const tasks = doc.tasks.map((task) => normalizeTask(task));
  return tasks.sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      Number(b.urgent) - Number(a.urgent) ||
      new Date(a.dueDate ?? "9999").getTime() -
        new Date(b.dueDate ?? "9999").getTime()
  );
};

export const saveTasks = async (tasks: ManagementTask[]): Promise<void> => {
  const doc = await readTasksDocument();
  await writeTasksDocument({
    ...doc,
    tasks,
    version: 1,
  });
};
