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

const DEFAULT_KEY = "management/tasks.json";

const emptyDocument = (): TasksDocument => ({
  version: 1,
  tasks: [],
  updatedAt: new Date().toISOString(),
});

const isLocalStorageEnabled = () => {
  const bucket = process.env.TASKS_S3_BUCKET?.trim();
  if (bucket) return false;
  return (
    process.env.TASKS_USE_LOCAL_STORAGE === "true" ||
    process.env.NODE_ENV === "development"
  );
};

const getS3Client = () => {
  const region =
    process.env.AWS_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    "us-east-1";
  return new S3Client({ region });
};

const getBucket = () => {
  const bucket = process.env.TASKS_S3_BUCKET?.trim();
  if (!bucket) {
    throw new Error("TASKS_S3_BUCKET is not configured");
  }
  return bucket;
};

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
    return parsed;
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
  return doc.tasks.sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
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
