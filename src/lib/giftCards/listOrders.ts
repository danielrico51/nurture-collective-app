import { readdir } from "fs/promises";
import path from "path";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { serverBillingConfig } from "@/config/billing";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import {
  buildGiftCardOrderListPrefix,
  parseGiftCardOrderIdFromKey,
} from "@/lib/giftCards/paths";
import { readGiftCardOrder } from "@/lib/giftCards/storage";
import type { GiftCardOrder } from "@/types/giftCard";

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const listGiftCardOrderIdsFromS3 = async (): Promise<string[]> => {
  const bucket = serverBillingConfig.s3Bucket;
  const prefix = buildGiftCardOrderListPrefix();
  const ids: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of response.Contents ?? []) {
      if (!item.Key) continue;
      const id = parseGiftCardOrderIdFromKey(item.Key);
      if (id) ids.push(id);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return ids;
};

const listGiftCardOrderIdsLocal = async (): Promise<string[]> => {
  const root = path.join(process.cwd(), ".data", buildGiftCardOrderListPrefix());
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("order_id="))
      .map((entry) => entry.name.replace(/^order_id=/, ""));
  } catch {
    return [];
  }
};

export const listGiftCardOrdersForMember = async (input: {
  email: string;
  userId?: string;
}): Promise<GiftCardOrder[]> => {
  const target = normalizeEmail(input.email);

  const orderIds = serverBillingConfig.useLocalStorage
    ? await listGiftCardOrderIdsLocal()
    : await listGiftCardOrderIdsFromS3();

  const orders = await Promise.all(orderIds.map((id) => readGiftCardOrder(id)));
  return orders
    .filter((order): order is GiftCardOrder => order !== null)
    .filter((order) => {
      if (input.userId && order.purchaserUserId === input.userId) return true;
      return target ? normalizeEmail(order.purchaser.email) === target : false;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};
