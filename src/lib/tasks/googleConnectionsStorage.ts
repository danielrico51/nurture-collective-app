import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import type {
  GoogleTasksConnectionsDocument,
  GoogleTasksUserConnection,
} from "@/types/googleTasksConnection";

const DEFAULT_KEY = "management/google-tasks-connections.json";
const DEFAULT_TASKS_BUCKET = "nurture-collective-tasks";
const LOCAL_DIR = path.join(process.cwd(), ".data", "management");
const LOCAL_FILE = path.join(LOCAL_DIR, "google-tasks-connections.json");

const emptyDocument = (): GoogleTasksConnectionsDocument => ({
  version: 1,
  connections: [],
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

const getObjectKey = () =>
  process.env.GOOGLE_TASKS_CONNECTIONS_S3_KEY?.trim() || DEFAULT_KEY;

const readLocalDocument = (): GoogleTasksConnectionsDocument => {
  if (!existsSync(LOCAL_FILE)) return emptyDocument();
  const parsed = JSON.parse(
    readFileSync(LOCAL_FILE, "utf8")
  ) as GoogleTasksConnectionsDocument;
  if (!Array.isArray(parsed.connections)) return emptyDocument();
  return parsed;
};

const writeLocalDocument = (document: GoogleTasksConnectionsDocument): void => {
  if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
  writeFileSync(LOCAL_FILE, JSON.stringify(document, null, 2));
};

const readS3Document = async (): Promise<GoogleTasksConnectionsDocument> => {
  const client = getS3Client();
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: getBucket(), Key: getObjectKey() })
    );
    const body = await response.Body?.transformToString();
    if (!body) return emptyDocument();
    const parsed = JSON.parse(body) as GoogleTasksConnectionsDocument;
    if (!Array.isArray(parsed.connections)) return emptyDocument();
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

const writeS3Document = async (
  document: GoogleTasksConnectionsDocument
): Promise<void> => {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: getObjectKey(),
      Body: JSON.stringify(
        { ...document, updatedAt: new Date().toISOString() },
        null,
        2
      ),
      ContentType: "application/json",
    })
  );
};

const readDocument = async (): Promise<GoogleTasksConnectionsDocument> => {
  if (isLocalStorageEnabled()) return readLocalDocument();
  return readS3Document();
};

const writeDocument = async (
  document: GoogleTasksConnectionsDocument
): Promise<void> => {
  if (isLocalStorageEnabled()) {
    writeLocalDocument(document);
    return;
  }
  await writeS3Document(document);
};

export const listGoogleTasksConnections =
  async (): Promise<GoogleTasksUserConnection[]> => {
    const doc = await readDocument();
    return doc.connections;
  };

export const getGoogleTasksConnection = async (
  email: string
): Promise<GoogleTasksUserConnection | null> => {
  const normalized = email.trim().toLowerCase();
  const connections = await listGoogleTasksConnections();
  return (
    connections.find((row) => row.email.trim().toLowerCase() === normalized) ??
    null
  );
};

export const saveGoogleTasksConnection = async (
  connection: GoogleTasksUserConnection
): Promise<GoogleTasksUserConnection> => {
  const doc = await readDocument();
  const normalized = connection.email.trim().toLowerCase();
  const next = doc.connections.filter(
    (row) => row.email.trim().toLowerCase() !== normalized
  );
  next.push({ ...connection, email: normalized });
  await writeDocument({ ...doc, connections: next, version: 1 });
  return connection;
};

export const removeGoogleTasksConnection = async (
  email: string
): Promise<boolean> => {
  const doc = await readDocument();
  const normalized = email.trim().toLowerCase();
  const next = doc.connections.filter(
    (row) => row.email.trim().toLowerCase() !== normalized
  );
  if (next.length === doc.connections.length) return false;
  await writeDocument({ ...doc, connections: next, version: 1 });
  return true;
};
