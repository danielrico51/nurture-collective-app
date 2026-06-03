import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { serverBillingConfig } from "@/config/billing";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import { buildGiftCardOrderKey } from "@/lib/giftCards/paths";
import type { GiftCardOrder } from "@/types/giftCard";

const localOrderPath = (orderId: string) =>
  path.join(process.cwd(), ".data", buildGiftCardOrderKey(orderId));

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

export const readGiftCardOrder = async (
  orderId: string
): Promise<GiftCardOrder | null> => {
  if (serverBillingConfig.useLocalStorage) {
    try {
      const raw = await readFile(localOrderPath(orderId), "utf8");
      return JSON.parse(raw) as GiftCardOrder;
    } catch {
      return null;
    }
  }

  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: serverBillingConfig.s3Bucket,
        Key: buildGiftCardOrderKey(orderId),
      })
    );
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as GiftCardOrder;
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

export const writeGiftCardOrder = async (order: GiftCardOrder): Promise<void> => {
  const payload: GiftCardOrder = {
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
      Key: buildGiftCardOrderKey(order.id),
      Body: JSON.stringify(payload, null, 2),
      ContentType: "application/json",
    })
  );
};
