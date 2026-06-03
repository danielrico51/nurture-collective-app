import { readdir } from "fs/promises";
import path from "path";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { serverBillingConfig } from "@/config/billing";
import { buildBillingOrderListPrefix } from "@/lib/billing/paths";
import { readPurchaseOrder } from "@/lib/billing/storage";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";
import type { PurchaseOrder } from "@/types/billing";

const getS3Client = () =>
  new S3Client({
    region:
      process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
    credentials: getServerCredentials(),
  });

const parseBillingOrderIdFromKey = (key: string): string | null => {
  const match = key.match(/billing\/orders\/order_id=([^/]+)\/order\.json$/);
  return match?.[1] ?? null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const listBillingOrderIdsFromS3 = async (): Promise<string[]> => {
  const bucket = serverBillingConfig.s3Bucket;
  const prefix = buildBillingOrderListPrefix();
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
      const id = parseBillingOrderIdFromKey(item.Key);
      if (id) ids.push(id);
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return ids;
};

const listBillingOrderIdsLocal = async (): Promise<string[]> => {
  const root = path.join(process.cwd(), ".data", buildBillingOrderListPrefix());
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("order_id="))
      .map((entry) => entry.name.replace(/^order_id=/, ""));
  } catch {
    return [];
  }
};

export const listPurchaseOrdersForMember = async (input: {
  email: string;
  userId: string;
}): Promise<PurchaseOrder[]> => {
  const targetEmail = normalizeEmail(input.email);
  const orderIds = serverBillingConfig.useLocalStorage
    ? await listBillingOrderIdsLocal()
    : await listBillingOrderIdsFromS3();

  const orders = await Promise.all(orderIds.map((id) => readPurchaseOrder(id)));
  return orders
    .filter((order): order is PurchaseOrder => order !== null)
    .filter(
      (order) =>
        (input.userId && order.userId === input.userId) ||
        (targetEmail && normalizeEmail(order.customerEmail) === targetEmail)
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};
