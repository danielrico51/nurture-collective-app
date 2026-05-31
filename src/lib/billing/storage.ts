import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { serverBillingConfig } from "@/config/billing";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { buildBillingOrderKey } from "@/lib/billing/paths";
import type { PurchaseOrder } from "@/types/billing";

const localOrderPath = (orderId: string) =>
  path.join(process.cwd(), ".data", buildBillingOrderKey(orderId));

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

export const readPurchaseOrder = async (
  orderId: string
): Promise<PurchaseOrder | null> => {
  if (serverBillingConfig.useLocalStorage) {
    try {
      const raw = await readFile(localOrderPath(orderId), "utf8");
      return JSON.parse(raw) as PurchaseOrder;
    } catch {
      return null;
    }
  }

  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: serverBillingConfig.s3Bucket,
        Key: buildBillingOrderKey(orderId),
      })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as PurchaseOrder;
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

export const writePurchaseOrder = async (order: PurchaseOrder): Promise<void> => {
  const payload: PurchaseOrder = {
    ...order,
    updatedAt: new Date().toISOString(),
  };

  if (serverBillingConfig.useLocalStorage) {
    const filePath = localOrderPath(order.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    return;
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: serverBillingConfig.s3Bucket,
      Key: buildBillingOrderKey(order.id),
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};

export const updatePurchaseOrder = async (
  orderId: string,
  patch: Partial<PurchaseOrder>
): Promise<PurchaseOrder> => {
  const existing = await readPurchaseOrder(orderId);
  if (!existing) {
    throw new Error(`Purchase order not found: ${orderId}`);
  }

  const updated: PurchaseOrder = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await writePurchaseOrder(updated);
  return updated;
};
