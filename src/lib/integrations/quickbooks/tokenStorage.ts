import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { serverQuickBooksConfig } from "@/config/quickbooks";
import { serverBillingConfig } from "@/config/billing";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import type { QuickBooksTokenSet } from "@/lib/integrations/quickbooks/types";

const LOCAL_TOKEN_PATH = path.join(
  process.cwd(),
  ".data",
  "integrations",
  "quickbooks",
  "oauth.json"
);

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const readLocalTokens = async (): Promise<QuickBooksTokenSet | null> => {
  try {
    const raw = await readFile(LOCAL_TOKEN_PATH, "utf8");
    return JSON.parse(raw) as QuickBooksTokenSet;
  } catch {
    return null;
  }
};

const writeLocalTokens = async (tokens: QuickBooksTokenSet): Promise<void> => {
  await mkdir(path.dirname(LOCAL_TOKEN_PATH), { recursive: true });
  await writeFile(LOCAL_TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf8");
};

const readS3Tokens = async (): Promise<QuickBooksTokenSet | null> => {
  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: serverBillingConfig.s3Bucket,
        Key: serverQuickBooksConfig.tokenStorageKey,
      })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as QuickBooksTokenSet;
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

const writeS3Tokens = async (tokens: QuickBooksTokenSet): Promise<void> => {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: serverBillingConfig.s3Bucket,
      Key: serverQuickBooksConfig.tokenStorageKey,
      Body: JSON.stringify(tokens, null, 2),
      ContentType: "application/json",
    })
  );
};

export const readQuickBooksTokens = async (): Promise<QuickBooksTokenSet | null> => {
  if (serverBillingConfig.useLocalStorage) {
    return readLocalTokens();
  }
  return readS3Tokens();
};

export const writeQuickBooksTokens = async (
  tokens: QuickBooksTokenSet
): Promise<void> => {
  if (serverBillingConfig.useLocalStorage) {
    await writeLocalTokens(tokens);
    return;
  }
  await writeS3Tokens(tokens);
};

export const buildTokenSetFromOAuthResponse = (input: {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  realmId: string;
}): QuickBooksTokenSet => ({
  accessToken: input.accessToken,
  refreshToken: input.refreshToken,
  expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000).toISOString(),
  realmId: input.realmId,
  updatedAt: new Date().toISOString(),
});

export const getEnvFallbackTokens = (): QuickBooksTokenSet | null => {
  const { refreshToken, realmId } = serverQuickBooksConfig;
  if (!refreshToken || !realmId) return null;
  return {
    accessToken: process.env.QBO_ACCESS_TOKEN?.trim() ?? "",
    refreshToken,
    expiresAt: process.env.QBO_TOKEN_EXPIRES_AT?.trim() ?? new Date(0).toISOString(),
    realmId,
    updatedAt: new Date().toISOString(),
  };
};
